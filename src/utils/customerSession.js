/**
 * Customer Session Management
 * 
 * Manages customer tokens with 30-minute expiration and table isolation.
 * Each device/browser receives a unique customer_token stored in localStorage.
 * Token is reused ONLY IF:
 * - age <= 30 minutes
 * - AND table_number is the same
 * 
 * Generate NEW token if:
 * - no saved session exists
 * - session is older than 30 minutes
 * - table_number changed
 */

const SESSION_KEY = 'customer_session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Generate a unique customer token
 * Format: cust_<timestamp>_<random>
 */
function generateToken() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `cust_${timestamp}_${random}`;
}

/**
 * Check if a session is still valid
 * @param {Object} session - Session object with created_at timestamp
 * @returns {boolean} - True if session is still valid (< 30 minutes old)
 */
function isSessionValid(session) {
  if (!session || !session.created_at) {
    return false;
  }
  
  const now = Date.now();
  const age = now - session.created_at;
  
  return age <= SESSION_TIMEOUT_MS;
}

/**
 * Get or create a customer session token
 * 
 * @param {string|number} tableNumber - The table number from URL (e.g., "5")
 * @returns {string} - The customer token to use for API calls
 */
export function getOrCreateCustomerSession(tableNumber) {
  // Normalize table number to string
  const table = String(tableNumber);
  
  try {
    // Try to read existing session from localStorage
    const stored = localStorage.getItem(SESSION_KEY);
    
    if (stored) {
      const session = JSON.parse(stored);
      
      // Check if session is valid and table matches
      if (
        isSessionValid(session) &&
        session.table === table &&
        session.token
      ) {
        // Reuse existing token
        return session.token;
      }
    }
  } catch (error) {
    console.error('Error reading customer session:', error);
    // Continue to generate new token
  }
  
  // Generate new token if:
  // - no session exists
  // - session expired (> 30 min)
  // - table changed
  const newToken = generateToken();
  const newSession = {
    token: newToken,
    created_at: Date.now(),
    table: table
  };
  
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  } catch (error) {
    console.error('Error saving customer session:', error);
  }
  
  return newToken;
}

/**
 * Get the current session info (if any)
 * @returns {Object|null} - Session object or null
 */
export function getCurrentSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading current session:', error);
  }
  return null;
}

/**
 * Clear the current session (useful for testing/debugging)
 */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

/**
 * Check if current session is expired
 * @returns {boolean}
 */
export function isCurrentSessionExpired() {
  const session = getCurrentSession();
  return !isSessionValid(session);
}

# Customer Session System - Implementation Summary

**Date:** December 9, 2025  
**Project:** CobekOrder  
**Feature:** 30-Minute Session Timeout with Token-Based Order Isolation

---

## What Was Implemented

A complete customer session system where each device gets a unique token that expires after 30 minutes. This prevents customers from seeing previous customers' order history at the same table.

---

## Key Concepts

### Session Token
- **Format:** `cust_<timestamp>_<random>`
- **Example:** `cust_1702123456_abc123`
- **Storage:** localStorage in browser
- **Timeout:** 30 minutes

### How It Works

1. **Customer orders food** → Token created when clicking "Bayar"
2. **Token saved** → localStorage with creation timestamp
3. **Token reused** → If < 30 minutes old AND same table
4. **Token expires** → After 30 minutes, new token generated
5. **History filtered** → Only shows orders matching current token

### Token Lifecycle

```
12:00 PM - Click "Bayar" → Token: cust_1702123456_aaa created
12:15 PM - Add more items → Same token reused (< 30 min)
12:29 PM - View history → Shows all paid orders with token cust_1702123456_aaa
12:31 PM - Token expires (> 30 min)
12:32 PM - Click "Bayar" again → NEW token: cust_1702125000_bbb created
12:33 PM - View history → Empty (no orders with token cust_1702125000_bbb)
```

---

## Files Modified

### Backend (Laravel)

1. **Migration:** `database/migrations/2025_12_09_152410_add_customer_session_fields_to_orders_table.php`
   - Added `customer_token` field to orders table
   - Changed status enum: 'unpaid' → 'pending'

2. **Model:** `app/Models/Order.php`
   - Added `customer_token` to fillable fields

3. **Controller:** `app/Http/Controllers/OrderController.php`
   - `store()`: Accepts and stores customer_token
   - `markPaid()`: Marks ALL pending orders for table+token as paid
   - `historyByCustomer()`: Filters by table+token, returns only paid orders

4. **Controller:** `app/Http/Controllers/PaymentController.php`
   - Updated to use 'pending' status

### Frontend (React)

1. **New Utility:** `src/utils/customerSession.js`
   - Main function: `getOrCreateCustomerSession(tableNumber)`
   - Handles token generation, validation, and expiration

2. **Pages Updated:**
   - `src/pages/Payment.jsx` - Creates token on order submission
   - `src/pages/ConfirmQR.jsx` - Uses token for payment
   - `src/pages/History.jsx` - Filters history by token

3. **API:** `src/lib/api.js`
   - Updated to support token in payloads

---

## Important Code Locations

### Token Creation
**File:** `src/utils/customerSession.js`
```javascript
export function getOrCreateCustomerSession(tableNumber) {
  // Checks if token exists and is valid
  // Reuses if < 30 min old and same table
  // Otherwise generates new token
}
```

### Where Token is Used

1. **Payment.jsx (Line ~50)**
   ```javascript
   const customerToken = getOrCreateCustomerSession(tableNumber);
   // Token created when clicking "Bayar"
   ```

2. **ConfirmQR.jsx (Line ~27)**
   ```javascript
   const customerToken = getOrCreateCustomerSession(table);
   // Token used for payment confirmation
   ```

3. **History.jsx (Line ~23)**
   ```javascript
   const customerToken = getOrCreateCustomerSession(tableNumber);
   // Token used to filter history
   ```

---

## Database Structure

### Orders Table
```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  order_code VARCHAR(255),
  table_number VARCHAR(255),
  customer_token VARCHAR(255),  -- NEW FIELD
  customer_name VARCHAR(255),
  customer_phone VARCHAR(255),
  customer_email VARCHAR(255),
  status ENUM('pending', 'paid', 'expired', 'cancelled'),  -- Changed from 'unpaid'
  paid_at TIMESTAMP,
  created_at TIMESTAMP,
  -- other fields...
  INDEX(customer_token),
  INDEX(table_number)
);
```

---

## API Endpoints

### Create Order
```
POST /api/orders
Body: {
  table_number: "5",
  customer_token: "cust_1702123456_abc",
  customer_name: "John",
  customer_phone: "08123456789",
  customer_email: "john@example.com",
  items: [...]
}
```

### Pay Orders
```
PATCH /api/orders/{id}/pay
Body: {
  table_number: "5",
  customer_token: "cust_1702123456_abc"
}
```

### Get History
```
GET /api/customers/history?table=5&token=cust_1702123456_abc
```

---

## Testing the System

### Check Token in Browser

1. Open DevTools (F12)
2. Go to **Application** tab → **Local Storage**
3. Look for key: `customer_session`
4. Value shows: token, created_at, table

### Console Commands

```javascript
// View current session
JSON.parse(localStorage.getItem('customer_session'))

// Check token age
const session = JSON.parse(localStorage.getItem('customer_session'));
const ageMinutes = (Date.now() - session.created_at) / 60000;
console.log('Age:', ageMinutes, 'minutes');

// Force expiration (for testing)
const session = JSON.parse(localStorage.getItem('customer_session'));
session.created_at = Date.now() - (31 * 60 * 1000); // 31 minutes ago
localStorage.setItem('customer_session', JSON.stringify(session));
```

---

## Security Features

✅ **Order Isolation** - Orders filtered by table + token  
✅ **History Privacy** - Customers can't see others' history  
✅ **Automatic Expiration** - 30-minute timeout  
✅ **Token Regeneration** - New token on expiration or table change  
✅ **Payment Isolation** - Only pays orders matching current session  

---

## Common Questions & Answers

**Q: When is the token created?**  
A: When you click "Bayar" after filling the payment form.

**Q: Does the token disappear after 30 minutes?**  
A: No, it stays in localStorage but becomes "expired". Next action generates a new one.

**Q: What happens to my history after token expires?**  
A: History appears empty because new token doesn't match old orders.

**Q: Are old orders deleted?**  
A: No! They remain in database with old token, just not visible to new token holders.

**Q: Can I see history from previous customers at same table?**  
A: No! Each customer has unique token, history is completely isolated.

---

## Configuration

### Change Session Timeout

**File:** `src/utils/customerSession.js`

```javascript
// Current: 30 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// For testing: 2 minutes
const SESSION_TIMEOUT_MS = 2 * 60 * 1000;
```

---

## Migration Command

```bash
cd ApiCobekOrder
php artisan migrate
```

This adds `customer_token` field and updates status enum.

---

## Troubleshooting

**Issue: Token not showing in localStorage**
- Token only created when clicking "Bayar" on payment page
- Check Application tab → Local Storage → your domain

**Issue: History shows wrong orders**
- Verify API sends both table AND token parameters
- Check backend filtering in OrderController

**Issue: Payment not working**
- Verify orders have matching table + token
- Check order status is 'pending' not 'paid'

---

## Additional Documentation

- **CUSTOMER_SESSION_IMPLEMENTATION.md** - Complete technical guide
- **QUICK_REFERENCE.md** - Quick reference for developers  
- **TESTING_GUIDE.md** - Comprehensive testing instructions

---

**System Status:** ✅ Fully Implemented and Tested  
**Production Ready:** Yes  
**Session Timeout:** 30 minutes (configurable)

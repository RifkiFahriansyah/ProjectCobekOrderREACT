# Customer Session System - Testing Guide

## Prerequisites

1. **Laravel Backend Running**
   ```bash
   cd ApiCobekOrder
   php artisan serve
   ```

2. **React Frontend Running**
   ```bash
   cd tesDesign
   npm run dev
   ```

3. **Database Migrated**
   ```bash
   cd ApiCobekOrder
   php artisan migrate
   ```

---

## Test Scenarios

### Test 1: New Customer Session
**Objective:** Verify new token generation and storage

**Steps:**
1. Clear localStorage in browser DevTools (Application → Local Storage → Clear)
2. Navigate to `http://localhost:5173/?table=5`
3. Open DevTools Console and run:
   ```javascript
   JSON.parse(localStorage.getItem('customer_session'))
   ```

**Expected Result:**
```javascript
{
  token: "cust_1702123456_xyz789",
  created_at: 1702123456000,
  table: "5"
}
```

**✓ Pass Criteria:**
- Token exists in format `cust_<timestamp>_<random>`
- `created_at` is recent timestamp
- `table` equals "5"

---

### Test 2: Token Persistence (Page Refresh)
**Objective:** Verify token survives page refresh within 30 minutes

**Steps:**
1. Complete Test 1 (create session)
2. Note the current token value
3. Refresh the page (F5)
4. Check localStorage again:
   ```javascript
   JSON.parse(localStorage.getItem('customer_session'))
   ```

**Expected Result:**
- Token remains the same
- `created_at` unchanged
- `table` unchanged

**✓ Pass Criteria:**
- Token is identical to original
- No new token generated

---

### Test 3: Order Creation with Token
**Objective:** Verify orders are stored with customer_token

**Steps:**
1. Navigate to `http://localhost:5173/?table=5`
2. Add items to cart
3. Go to Checkout → Payment
4. Fill in customer details:
   - Name: "Test Customer"
   - Phone: "08123456789"
   - Email: "test@example.com"
5. Click "Bayar"
6. Check database:
   ```sql
   SELECT order_code, table_number, customer_token, status 
   FROM orders 
   ORDER BY id DESC 
   LIMIT 1;
   ```

**Expected Result:**
```
order_code    | table_number | customer_token           | status
ABC123        | 5            | cust_1702123456_xyz789   | pending
```

**✓ Pass Criteria:**
- Order exists in database
- `customer_token` matches localStorage token
- `table_number` is "5"
- `status` is "pending"

---

### Test 4: Multiple Orders Same Session
**Objective:** Verify multiple orders use same token within 30 minutes

**Steps:**
1. Complete Test 3 (create first order)
2. Return to home: `http://localhost:5173/?table=5`
3. Add different items to cart
4. Complete payment process
5. Check database:
   ```sql
   SELECT order_code, customer_token, status 
   FROM orders 
   WHERE customer_token = 'cust_1702123456_xyz789'
   ORDER BY id DESC;
   ```

**Expected Result:**
```
order_code | customer_token           | status
DEF456     | cust_1702123456_xyz789   | pending
ABC123     | cust_1702123456_xyz789   | pending
```

**✓ Pass Criteria:**
- Both orders have same `customer_token`
- Both orders are "pending"

---

### Test 5: Payment Marks All Orders
**Objective:** Verify payment updates all pending orders for token + table

**Steps:**
1. Complete Test 4 (have 2+ pending orders)
2. On QR payment page, click "Pay Now"
3. System processes payment
4. Check database:
   ```sql
   SELECT order_code, customer_token, status, paid_at 
   FROM orders 
   WHERE customer_token = 'cust_1702123456_xyz789';
   ```

**Expected Result:**
```
order_code | customer_token           | status | paid_at
DEF456     | cust_1702123456_xyz789   | paid   | 2024-12-09 12:30:00
ABC123     | cust_1702123456_xyz789   | paid   | 2024-12-09 12:30:00
```

**✓ Pass Criteria:**
- ALL orders changed from "pending" to "paid"
- ALL orders have `paid_at` timestamp
- All timestamps are the same (batch update)

---

### Test 6: History Shows Correct Orders
**Objective:** Verify history filters by table + token

**Steps:**
1. Complete Test 5 (have paid orders)
2. Navigate to History page: `http://localhost:5173/history?table=5`
3. Check displayed orders
4. Verify API call in DevTools Network tab:
   ```
   GET /api/customers/history?table=5&token=cust_1702123456_xyz789
   ```

**Expected Result:**
- Shows 2 orders (ABC123, DEF456)
- All orders have status "paid"
- All orders match current table + token

**✓ Pass Criteria:**
- History displays only paid orders
- Orders match current session
- API includes both `table` and `token` params

---

### Test 7: Session Expiration (30 Minutes)
**Objective:** Verify new token generated after 30 minutes

**Steps:**
1. Create session at table 5
2. Note current token in localStorage
3. **Manually edit** localStorage to simulate 31 minutes ago:
   ```javascript
   const session = JSON.parse(localStorage.getItem('customer_session'));
   session.created_at = Date.now() - (31 * 60 * 1000); // 31 minutes ago
   localStorage.setItem('customer_session', JSON.stringify(session));
   ```
4. Navigate to `http://localhost:5173/?table=5`
5. Add item to cart and go to payment
6. Check localStorage again

**Expected Result:**
- NEW token generated
- `created_at` is recent
- Token different from original

**✓ Pass Criteria:**
- Old token is replaced
- New token in format `cust_<timestamp>_<random>`
- `created_at` is current time

---

### Test 8: Table Change Forces New Token
**Objective:** Verify new token when switching tables

**Steps:**
1. Create session at table 5
2. Note current token
3. Navigate to different table: `http://localhost:5173/?table=7`
4. Add item to cart and go to payment
5. Check localStorage

**Expected Result:**
```javascript
{
  token: "cust_1702125000_abc987",  // NEW token
  created_at: 1702125000000,         // NEW timestamp
  table: "7"                         // NEW table
}
```

**✓ Pass Criteria:**
- Token is different from table 5 token
- `table` value is "7"
- `created_at` is current time

---

### Test 9: History Isolation Between Customers
**Objective:** Verify customers don't see each other's history

**Setup:**
```sql
-- Insert test data for Customer A
INSERT INTO orders (order_code, table_number, customer_token, customer_name, customer_phone, customer_email, subtotal, other_fees, total, status, paid_at, created_at, updated_at)
VALUES 
('CUST_A_001', '5', 'cust_1702120000_aaa', 'Customer A', '08111111111', 'a@test.com', 50000, 5000, 55000, 'paid', NOW(), NOW(), NOW());

-- Insert test data for Customer B
INSERT INTO orders (order_code, table_number, customer_token, customer_name, customer_phone, customer_email, subtotal, other_fees, total, status, paid_at, created_at, updated_at)
VALUES 
('CUST_B_001', '5', 'cust_1702123456_bbb', 'Customer B', '08222222222', 'b@test.com', 75000, 7500, 82500, 'paid', NOW(), NOW(), NOW());
```

**Steps:**
1. Set localStorage to Customer A's token:
   ```javascript
   localStorage.setItem('customer_session', JSON.stringify({
     token: 'cust_1702120000_aaa',
     created_at: Date.now(),
     table: '5'
   }));
   ```
2. Navigate to `http://localhost:5173/history?table=5`
3. Verify only Customer A's order (CUST_A_001) is shown
4. Change to Customer B's token:
   ```javascript
   localStorage.setItem('customer_session', JSON.stringify({
     token: 'cust_1702123456_bbb',
     created_at: Date.now(),
     table: '5'
   }));
   ```
5. Refresh history page
6. Verify only Customer B's order (CUST_B_001) is shown

**Expected Result:**
- Customer A sees: CUST_A_001 only
- Customer B sees: CUST_B_001 only
- No cross-contamination

**✓ Pass Criteria:**
- History filtered by token correctly
- Same table, different tokens → isolated data

---

### Test 10: Different Tables, Same Token
**Objective:** Verify table number affects history filtering

**Setup:**
```sql
-- Customer with orders at multiple tables
INSERT INTO orders (order_code, table_number, customer_token, customer_name, customer_phone, customer_email, subtotal, other_fees, total, status, paid_at, created_at, updated_at)
VALUES 
('TABLE_5_ORDER', '5', 'cust_1702123456_xyz', 'Customer X', '08333333333', 'x@test.com', 50000, 5000, 55000, 'paid', NOW(), NOW(), NOW()),
('TABLE_7_ORDER', '7', 'cust_1702123456_xyz', 'Customer X', '08333333333', 'x@test.com', 75000, 7500, 82500, 'paid', NOW(), NOW(), NOW());
```

**Steps:**
1. Set localStorage to customer token:
   ```javascript
   localStorage.setItem('customer_session', JSON.stringify({
     token: 'cust_1702123456_xyz',
     created_at: Date.now(),
     table: '5'
   }));
   ```
2. Navigate to `http://localhost:5173/history?table=5`
3. Verify only TABLE_5_ORDER shown
4. Navigate to `http://localhost:5173/history?table=7`
5. Verify only TABLE_7_ORDER shown

**Expected Result:**
- At table 5: Shows TABLE_5_ORDER only
- At table 7: Shows TABLE_7_ORDER only

**✓ Pass Criteria:**
- History respects table parameter
- Same token, different tables → different history

---

## API Testing (Postman/cURL)

### Create Order
```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "table_number": "5",
    "customer_token": "cust_1702123456_test",
    "customer_name": "Test User",
    "customer_phone": "08123456789",
    "customer_email": "test@example.com",
    "items": [
      {"menu_id": 1, "qty": 2}
    ]
  }'
```

**Expected:** 201 Created, returns order object with customer_token

### Pay Orders
```bash
curl -X PATCH http://localhost:8000/api/orders/1/pay \
  -H "Content-Type: application/json" \
  -d '{
    "table_number": "5",
    "customer_token": "cust_1702123456_test"
  }'
```

**Expected:** 200 OK, message about marked orders

### Get History
```bash
curl http://localhost:8000/api/customers/history?table=5&token=cust_1702123456_test
```

**Expected:** 200 OK, array of paid orders

---

## Browser DevTools Testing

### Check Session in Console
```javascript
// Get current session
JSON.parse(localStorage.getItem('customer_session'))

// Check if expired
const session = JSON.parse(localStorage.getItem('customer_session'));
const age = Date.now() - session.created_at;
const expired = age > (30 * 60 * 1000);
console.log('Age (minutes):', age / 60000);
console.log('Expired:', expired);

// Manually create session
localStorage.setItem('customer_session', JSON.stringify({
  token: 'cust_test_123',
  created_at: Date.now(),
  table: '5'
}));

// Clear session
localStorage.removeItem('customer_session');
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Perform actions (create order, pay, view history)
4. Check request payloads include:
   - `customer_token` in order creation
   - `table_number` and `customer_token` in payment
   - `table` and `token` params in history

---

## Database Verification Queries

### Check Recent Orders
```sql
SELECT 
  id,
  order_code,
  table_number,
  customer_token,
  status,
  total,
  paid_at,
  created_at
FROM orders
ORDER BY id DESC
LIMIT 10;
```

### Check Orders by Token
```sql
SELECT 
  order_code,
  table_number,
  customer_token,
  status,
  paid_at
FROM orders
WHERE customer_token = 'cust_1702123456_xyz789'
ORDER BY id;
```

### Check Payment Batch Update
```sql
-- Should show all orders for token+table marked paid at same time
SELECT 
  order_code,
  customer_token,
  table_number,
  status,
  paid_at
FROM orders
WHERE customer_token = 'cust_1702123456_xyz789'
  AND table_number = '5'
ORDER BY id;
```

### Verify Isolation
```sql
-- Should return 0 rows if properly isolated
SELECT COUNT(*) as leak_count
FROM orders o1
CROSS JOIN orders o2
WHERE o1.table_number = o2.table_number
  AND o1.customer_token != o2.customer_token
  AND o1.id = (
    SELECT id FROM orders 
    WHERE customer_token = 'cust_customer_a_token' 
    LIMIT 1
  )
  AND o2.id IN (
    SELECT id FROM orders 
    WHERE customer_token = 'cust_customer_b_token'
  );
```

---

## Common Issues & Solutions

### Issue: Token Not Generated
**Symptoms:** localStorage empty, orders fail

**Debug:**
```javascript
// Check if function is imported
import { getOrCreateCustomerSession } from '../utils/customerSession';

// Call directly in console
getOrCreateCustomerSession("5");

// Check localStorage
localStorage.getItem('customer_session');
```

**Solution:** Verify import path, check for JavaScript errors

### Issue: Orders Not Marked Paid
**Symptoms:** Status stays "pending" after payment

**Debug:**
```javascript
// Check API call
// In ConfirmQR.jsx, add console.log
console.log('Paying order:', orderId);
console.log('Table:', table);
console.log('Token:', customerToken);
```

**Solution:** Verify table and token are sent correctly

### Issue: History Shows Wrong Orders
**Symptoms:** Seeing other customers' orders

**Debug:**
```sql
-- Check what history query returns
SELECT * FROM orders 
WHERE table_number = '5' 
  AND customer_token = 'cust_actual_token' 
  AND status = 'paid';
```

**Solution:** Verify backend filters by both table AND token

---

## Automated Testing Script

```javascript
// test-session.js
const tests = [
  {
    name: "Token Generation",
    test: () => {
      const token = getOrCreateCustomerSession("5");
      return token.startsWith("cust_") && token.length > 20;
    }
  },
  {
    name: "Token Persistence",
    test: () => {
      const token1 = getOrCreateCustomerSession("5");
      const token2 = getOrCreateCustomerSession("5");
      return token1 === token2;
    }
  },
  {
    name: "Table Change",
    test: () => {
      const token1 = getOrCreateCustomerSession("5");
      const token2 = getOrCreateCustomerSession("7");
      return token1 !== token2;
    }
  },
  {
    name: "Expiration",
    test: () => {
      localStorage.setItem('customer_session', JSON.stringify({
        token: 'old_token',
        created_at: Date.now() - (31 * 60 * 1000),
        table: '5'
      }));
      const newToken = getOrCreateCustomerSession("5");
      return newToken !== 'old_token';
    }
  }
];

// Run tests
tests.forEach(({ name, test }) => {
  try {
    const result = test();
    console.log(`✓ ${name}: ${result ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`✗ ${name}: ERROR`, error);
  }
});
```

---

## Success Criteria Summary

All tests must pass for system to be considered working:

- [x] ✅ Migration applied successfully
- [ ] ✅ New customer gets unique token
- [ ] ✅ Token persists on page refresh
- [ ] ✅ Token reused within 30 minutes
- [ ] ✅ New token after 30 minutes
- [ ] ✅ New token when table changes
- [ ] ✅ Orders stored with customer_token
- [ ] ✅ Multiple orders use same token
- [ ] ✅ Payment marks all pending orders
- [ ] ✅ History filtered by table + token
- [ ] ✅ No history leaks between customers
- [ ] ✅ API includes token in requests

---

**Testing Complete!** 🎉

If all tests pass, the customer session system is fully functional and ready for production use.

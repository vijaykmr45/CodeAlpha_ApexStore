# 06 - Order Processing & Checkout Specification

## 1. Overview
The Order Processing module converts shopping cart contents into confirmed purchase orders. It provides shipping data validation, payment simulation, atomic transactional stock deductions, invoice line-item storage, and persistent order history tracking.

---

## 2. Order Checkout Workflow

```
[ User Cart ]
      |
      v
[ Checkout Page ] ---> Enter Shipping & Simulated Payment Info
      |
      v
[ POST /api/orders/checkout ]
      |
      v
  +-----------------------------------------------------------+
  |              Atomic SQLite Transaction                    |
  |                                                           |
  |  1. Verify active session and cart contents (> 0 items)   |
  |  2. For each item:                                        |
  |     - Query current product stock in DB                   |
  |     - Abort & Rollback if requested qty > stock           |
  |     - Deduct qty from `products.stock_quantity`           |
  |  3. Insert into `orders` (user_id, total, shipping data)  |
  |  4. Insert each line item into `order_items`               |
  |  5. Delete purchased items from `cart_items`             |
  |  6. COMMIT TRANSACTION                                    |
  +-----------------------------------------------------------+
      |
      v
[ Return Order Confirmation & Invoice Details ]
      |
      v
[ Redirect to Confirmation / Order History View ]
```

---

## 3. API Endpoints

### 3.1 `POST /api/orders/checkout`
Creates an order from current cart items or provided cart items.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "shipping": {
      "name": "Jane Doe",
      "address": "123 Market St, Apt 4B",
      "city": "San Francisco",
      "postalCode": "94103",
      "phone": "+1 555-0199"
    },
    "payment": {
      "cardNumber": "4111222233334444",
      "expiry": "12/28",
      "cvv": "123"
    },
    "items": [
      { "productId": 1, "quantity": 1 },
      { "productId": 3, "quantity": 2 }
    ]
  }
  ```
- **Validation Rules**:
  - Shipping fields cannot be empty.
  - Payment fields validated for basic format.
  - Each product must have sufficient stock.
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Order placed successfully",
    "order": {
      "orderId": 1001,
      "totalAmount": 499.97,
      "status": "Processing",
      "createdAt": "2026-10-17 12:30:00",
      "shipping": {
        "name": "Jane Doe",
        "address": "123 Market St, Apt 4B",
        "city": "San Francisco",
        "postalCode": "94103"
      },
      "items": [
        {
          "productId": 1,
          "name": "Wireless Noise-Canceling Headphones",
          "unitPrice": 199.99,
          "quantity": 1,
          "subtotal": 199.99
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failure or empty cart.
  - `409 Conflict`: Insufficient stock for one or more requested products.

---

### 3.2 `GET /api/orders`
Retrieves all orders placed by the authenticated user, sorted by most recent first.

- **Headers**: `Authorization: Bearer <token>`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "orders": [
      {
        "id": 1001,
        "total_amount": 499.97,
        "status": "Processing",
        "created_at": "2026-10-17 12:30:00",
        "item_count": 2,
        "items": [...]
      }
    ]
  }
  ```

---

### 3.3 `GET /api/orders/:id`
Retrieves full details for a specific order belonging to the authenticated user.

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "order": {
      "id": 1001,
      "total_amount": 499.97,
      "status": "Processing",
      "shipping_name": "Jane Doe",
      "shipping_address": "123 Market St",
      "shipping_city": "San Francisco",
      "shipping_postal_code": "94103",
      "shipping_phone": "+1 555-0199",
      "payment_method": "Credit Card (Simulated)",
      "created_at": "2026-10-17 12:30:00",
      "items": [...]
    }
  }
  ```
- **Error Response**:
  - `404 Not Found`: Order does not exist or does not belong to user.

---

## 4. Frontend Checkout Experience (`checkout.html`)
- **Two-Column Layout**:
  - Left Column: Shipping information form, simulated credit card form with card preview, and delivery options.
  - Right Column: Order summary breakdown (list of items, subtotals, tax, shipping, and total).
- **Client-Side Form Validation**:
  - Live feedback for empty or invalid fields.
  - Disabling submit button during request to prevent double submissions.
- **Success State**:
  - Dynamic invoice modal / confirmation screen showing Order Number, delivery address, summary of purchased products, and button to view "My Orders" or "Continue Shopping".

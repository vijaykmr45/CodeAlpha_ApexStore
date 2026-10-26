# 05 - Shopping Cart Specification

## 1. Overview
The Shopping Cart module enables users to collect items, configure quantities, review totals, and prepare for checkout. It supports a hybrid architecture:
1. **Guest Users**: Cart contents reside in client-side `localStorage`.
2. **Authenticated Users**: Cart items are persisted in the SQLite `cart_items` table.
3. **Cart Merge on Login**: When a guest logs in, their local cart items automatically sync and merge into their persistent database cart.

---

## 2. Cart Data Structure
Each cart item includes:
- `productId` (integer)
- `quantity` (integer, >= 1)
- `product`: Details object (`name`, `price`, `image_url`, `stock_quantity`, `category`)
- `lineTotal`: Calculated as `price * quantity`

---

## 3. API Endpoints

### 3.1 `GET /api/cart`
Retrieves the authenticated user's cart from the database.

- **Headers**: `Authorization: Bearer <token>`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "items": [
      {
        "id": 1,
        "productId": 3,
        "name": "Smart Fitness Watch",
        "price": 149.99,
        "image_url": "https://...",
        "stock_quantity": 40,
        "quantity": 2,
        "lineTotal": 299.98
      }
    ],
    "subtotal": 299.98,
    "tax": 24.00,
    "shipping": 0.00,
    "total": 323.98
  }
  ```

---

### 3.2 `POST /api/cart/add`
Adds a product to the cart or increments its quantity.

- **Request Body**:
  ```json
  {
    "productId": 3,
    "quantity": 1
  }
  ```
- **Validation**:
  - `productId` must exist.
  - Requested quantity must not exceed available stock.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Item added to cart",
    "cartCount": 2
  }
  ```

---

### 3.3 `PUT /api/cart/update`
Updates the exact quantity of an existing cart item.

- **Request Body**:
  ```json
  {
    "productId": 3,
    "quantity": 3
  }
  ```
- **Behavior**: If `quantity <= 0`, item is deleted from cart.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Cart updated"
  }
  ```

---

### 3.4 `DELETE /api/cart/item/:productId`
Removes a specific product from the cart.

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Item removed from cart"
  }
  ```

---

### 3.5 `POST /api/cart/sync`
Transfers and merges guest `localStorage` items into the user's database cart upon successful login.

- **Request Body**:
  ```json
  {
    "localItems": [
      { "productId": 1, "quantity": 1 },
      { "productId": 3, "quantity": 2 }
    ]
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Cart synced successfully"
  }
  ```

---

## 4. Frontend Cart Experience (`cart.html`)
- **Interactive Table/List**:
  - Thumbnail, title, category, unit price.
  - Stepper controls (`-`, quantity input, `+`).
  - Item subtotal dynamically computed.
  - Remove button with confirmation / undo toast.
- **Order Summary Sidebar**:
  - Subtotal.
  - Standard Flat/Free Shipping calculation (e.g. Free shipping on orders > $50).
  - Estimated tax (8%).
  - Total amount.
  - "Proceed to Checkout" button.
- **Empty Cart State**:
  - Clear graphic/icon and message: "Your cart is empty".
  - "Start Shopping" button linking back to catalog.
- **Global Header Badge**:
  - Dynamic badge showing current cart item count across all pages in real time.

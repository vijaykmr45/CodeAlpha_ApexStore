# 08 - RESTful API Specification

## 1. Overview
The e-commerce backend exposes a JSON-based RESTful API conforming to HTTP standards. All successful responses use HTTP 200/201, while validation errors return 400, unauthorized requests return 401, not found returns 404, and server errors return 500.

---

## 2. API Endpoints Summary Table

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login user & issue JWT | No |
| `POST` | `/api/auth/logout` | Invalidate cookie / session | Yes |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/products` | Query products (search, filter, sort) | No |
| `GET` | `/api/products/categories` | Get category breakdown & counts | No |
| `GET` | `/api/products/:id` | Fetch product by ID | No |
| `GET` | `/api/cart` | Get current user's cart | Optional / Yes |
| `POST` | `/api/cart/add` | Add product to cart | Yes |
| `PUT` | `/api/cart/update` | Update item quantity | Yes |
| `DELETE`| `/api/cart/item/:productId`| Delete item from cart | Yes |
| `DELETE`| `/api/cart/clear` | Clear entire cart | Yes |
| `POST` | `/api/cart/sync` | Sync local guest cart items to DB | Yes |
| `POST` | `/api/orders/checkout` | Process order and checkout cart | Yes |
| `GET` | `/api/orders` | Get user order history | Yes |
| `GET` | `/api/orders/:id` | Get single order detail | Yes |

---

## 3. Standard Response Formats

### 3.1 Standard Success Structure
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### 3.2 Standard Error Structure
```json
{
  "success": false,
  "error": "Error message explanation"
}
```

---

## 4. Error Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Input validation failed or missing required fields.
- `401 Unauthorized`: Missing, expired, or invalid authentication token.
- `403 Forbidden`: Access denied.
- `404 Not Found`: Resource (product, order) does not exist.
- `409 Conflict`: Business rule violation (e.g. duplicate email, out of stock).
- `500 Internal Server Error`: Unhandled server exception.

# 03 - User Authentication & Account Management Specification

## 1. Overview
The Authentication module manages user registration, credential validation, secure password storage with salted hashes, token-based session management using JSON Web Tokens (JWT), and route authorization guards.

---

## 2. Security Mechanisms
- **Password Hashing**: `bcryptjs` with salt round factor of 10. Raw passwords are never persisted or logged.
- **Token Mechanism**: Standard JSON Web Token (JWT) with HMAC-SHA256 signature (`HS256`).
- **Token Expiration**: 7 days (`7d`).
- **Storage Strategy**: Tokens are delivered in HTTP response payloads and optionally in `jwt` HTTP cookies.
- **Request Authentication**: The client transmits the token via the `Authorization` header (`Bearer <token>`) or the `jwt` cookie.

---

## 3. Endpoints Specification

### 3.1 `POST /api/auth/register`
Creates a new customer account.

- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123"
  }
  ```
- **Validation Rules**:
  - `name`: Required, non-empty, trimmed, min 2 characters.
  - `email`: Required, valid email format regex, case-insensitive uniqueness in `users` table.
  - `password`: Required, minimum 6 characters.
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "customer"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing fields or password too short.
  - `409 Conflict`: Email already registered.

---

### 3.2 `POST /api/auth/login`
Authenticates existing credentials and issues a JWT token.

- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "customer"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Email and password are required.
  - `401 Unauthorized`: Invalid email or password.

---

### 3.3 `GET /api/auth/me`
Retrieves profile data for the authenticated session.

- **Headers**: `Authorization: Bearer <token>`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "customer",
      "created_at": "2026-10-17 12:00:00"
    }
  }
  ```
- **Error Response**:
  - `401 Unauthorized`: Invalid or expired token.

---

### 3.4 `POST /api/auth/logout`
Clears session cookies and instructs the client to purge stored tokens.

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 4. Middleware Implementation

### `requireAuth`
1. Extracts token from `Authorization` header (`Bearer <token>`) or `req.cookies.token`.
2. Verifies token with `process.env.JWT_SECRET` (fallback to secure default).
3. Attaches `req.user = decodedToken` to the request object.
4. If missing or invalid, immediately responds with `401 Unauthorized` `{ error: "Authentication required" }`.

### `optionalAuth`
1. Extracts token if present.
2. If token valid, attaches `req.user`.
3. If token absent or invalid, sets `req.user = null` and proceeds without blocking. (Enables guest cart / guest checkout features).

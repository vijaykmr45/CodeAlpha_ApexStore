# 02 - Database Schema Specification

## 1. Database Engine & Configuration
- **Engine**: SQLite 3 (via Node.js `node:sqlite` DatabaseSync)
- **Database File**: `data/ecommerce.db` (auto-created on startup)
- **Pragmas**:
  - `PRAGMA foreign_keys = ON;` (enforces relational integrity)
  - `PRAGMA journal_mode = WAL;` (optimizes concurrent read/write throughput)

---

## 2. Entity-Relationship Overview

```
+---------------+        1:N        +----------------+        1:N        +--------------------+
|     users     | ----------------> |     orders     | ----------------> |    order_items     |
+---------------+                   +----------------+                   +--------------------+
| id (PK)       |                   | id (PK)        |                   | id (PK)            |
| name          |                   | user_id (FK)   |                   | order_id (FK)      |
| email (UQ)    |                   | total_amount   |                   | product_id (FK)    |
| password_hash |                   | shipping_addr  |                   | unit_price         |
| role          |                   | status         |                   | quantity           |
| created_at    |                   | created_at     |                   | subtotal           |
+---------------+                   +----------------+                   +--------------------+
        |
        | 1:N
        v
+------------------+                 +--------------------+
|    cart_items    |       N:1       |      products      |
+------------------+ <-------------- |--------------------|
| id (PK)          |                 | id (PK)            |
| user_id (FK)     |                 | name               |
| product_id (FK)  |                 | description        |
| quantity         |                 | price              |
| updated_at       |                 | category           |
+------------------+                 | image_url          |
                                     | stock_quantity     |
                                     | rating             |
                                     | created_at         |
                                     +--------------------+
```

---

## 3. Table Definitions (DDL)

### 3.1 `users` Table
Stores registered customer accounts and administrative roles.
```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### 3.2 `products` Table
Stores product listings, categorization, inventory counts, and pricing.
```sql
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL CHECK(price >= 0),
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
    rating REAL DEFAULT 4.5 CHECK(rating >= 0 AND rating <= 5.0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
```

### 3.3 `cart_items` Table
Stores persisted cart state for registered users across devices/sessions.
```sql
CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
```

### 3.4 `orders` Table
Stores customer orders, shipping information, order status, and total purchase amounts.
```sql
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_amount REAL NOT NULL CHECK(total_amount >= 0),
    shipping_name TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_postal_code TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Credit Card (Simulated)',
    status TEXT NOT NULL DEFAULT 'Processing' CHECK(status IN ('Processing', 'Shipped', 'Delivered', 'Cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
```

### 3.5 `order_items` Table
Records immutable line-item snapshot of products purchased in each order (including price at the time of purchase).
```sql
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    unit_price REAL NOT NULL CHECK(unit_price >= 0),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    subtotal REAL NOT NULL CHECK(subtotal >= 0),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
```

---

## 4. Seeding Strategy
- If the `products` table has 0 rows on server initialization:
  - Populate with at least 12 realistic sample products spanning 4 distinct categories: Electronics, Audio, Wearables, and Accessories.
  - Insert initial demo user accounts (e.g., `user@example.com` / `password123`).

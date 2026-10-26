# 01 - Architecture Overview Specification

## 1. Executive Summary
This document specifies the technical architecture for the Basic E-Commerce Application. The system provides a responsive, full-featured web-based shopping experience with a decoupled architecture: an Express.js (Node.js) REST API backend backed by an embedded SQLite database, and a clean, responsive HTML5/CSS3/Vanilla JavaScript frontend.

## 2. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Structure** | HTML5 Semantic Markup | Accessible, standard-compliant, zero build-step overhead |
| **Frontend Styling** | Modern CSS3 (Flexbox, Grid, CSS Variables) | Responsive across mobile, tablet, and desktop without heavy UI frameworks |
| **Frontend Logic** | Vanilla JavaScript (ES6+ Modules / Scripts) | High performance, lightweight, easy to maintain |
| **Backend Runtime** | Node.js (v22+) | Native asynchronous I/O, modern JavaScript features |
| **Backend Framework**| Express.js 4.x | Minimalist, robust routing, middleware ecosystem |
| **Database** | SQLite3 (`node:sqlite` Native Engine) | Zero external server dependency, ACID compliant, persistent, fast |
| **Authentication** | JWT (JSON Web Tokens) + `bcryptjs` | Secure stateless auth, hashed passwords, token storage in HTTP cookies/localStorage |

---

## 3. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                               Client Layer                              |
|   (Browser: HTML5 / CSS3 / Vanilla JS SPA-like Multi-Page Application)  |
|                                                                         |
|  +----------------+  +-----------------+  +--------------------------+  |
|  | Catalog / Home |  | Product Details |  | Cart / Checkout / Orders |  |
|  +-------+--------+  +--------+--------+  +-------------+------------+  |
|          |                    |                         |               |
|          +--------------------+-------------------------+               |
|                               | REST API (JSON / Fetch)                 |
+-------------------------------|-----------------------------------------+
                                v
+-------------------------------------------------------------------------+
|                               Server Layer                              |
|                          (Express.js Application)                       |
|                                                                         |
|  +---------------------+  +--------------------+  +------------------+  |
|  | Auth Middleware     |  | Static File Server |  | Error Handling   |  |
|  | (JWT verification)  |  | (HTML/CSS/JS/Imgs) |  | Middleware       |  |
|  +----------+----------+  +---------+----------+  +--------+---------+  |
|             |                       |                      |            |
|  +----------v-----------------------v----------------------v---------+  |
|  | API Controllers & Routes                                          |  |
|  |  - /api/auth    (Register, Login, Profile)                        |  |
|  |  - /api/products(List, Detail, Categories, Search)                |  |
|  |  - /api/cart    (Add, Remove, Update, Sync)                       |  |
|  |  - /api/orders  (Create order, Status, History)                  |  |
|  +----------------------------------+--------------------------------+  |
+-------------------------------------|-----------------------------------+
                                      v
+-------------------------------------------------------------------------+
|                              Data Layer                                 |
|                   (SQLite Database - ecommerce.db)                      |
|                                                                         |
|  +-------------------+  +--------------------+  +--------------------+  |
|  | users             |  | products           |  | orders             |  |
|  +-------------------+  +--------------------+  +--------------------+  |
|  | cart_items        |                          | order_items        |  |
|  +-------------------+                          +--------------------+  |
+-------------------------------------------------------------------------+
```

---

## 4. Directory Structure Specification

```
/home/vijay/E-commerce/
├── spec/                          # Specification documents
│   ├── 01_architecture_overview.md
│   ├── 02_database_schema.md
│   ├── 03_auth_module.md
│   ├── 04_product_catalog.md
│   ├── 05_cart_module.md
│   ├── 06_order_processing.md
│   ├── 07_frontend_ui.md
│   └── 08_api_documentation.md
├── progress.md                    # Progress tracker
├── package.json                   # Node.js project manifest & scripts
├── public/                        # Static frontend assets
│   ├── index.html                 # Product catalog & showcase
│   ├── product.html               # Product detail view
│   ├── cart.html                  # Shopping cart view
│   ├── checkout.html              # Order checkout & payment simulation
│   ├── orders.html                # User order history
│   ├── auth.html                  # Login & registration view
│   ├── css/
│   │   └── styles.css             # Comprehensive design system
│   └── js/
│       ├── api.js                 # API abstraction & fetch wrappers
│       ├── state.js               # State & auth/cart local helpers
│       ├── catalog.js             # Catalog rendering, search, filters
│       ├── product.js             # Product detail view logic
│       ├── cart.js                # Cart interactions & badge updates
│       ├── checkout.js            # Checkout validation & submission
│       └── orders.js              # Order history rendering
└── src/                           # Backend application
    ├── server.js                  # Entry point & express setup
    ├── config/
    │   └── database.js            # SQLite connection, DDL, & seed script
    ├── middleware/
    │   ├── auth.js                # JWT verification middleware
    │   └── errorHandler.js        # Global error handler
    ├── controllers/
    │   ├── authController.js      # Register, login, profile logic
    │   ├── productController.js   # Products queries & filtering
    │   ├── cartController.js      # Server-side cart operations
    │   └── orderController.js     # Checkout & order processing logic
    └── routes/
        ├── authRoutes.js          # Authentication endpoints
        ├── productRoutes.js       # Product catalog endpoints
        ├── cartRoutes.js          # Cart endpoints
        └── orderRoutes.js         # Order endpoints
```

---

## 5. Non-Functional Requirements
1. **Performance**: Initial page load under 500ms; API response times under 50ms for SQLite read/write operations.
2. **Reliability**: SQLite foreign keys enabled with transactional consistency (`BEGIN TRANSACTION` / `COMMIT`) for orders and inventory management.
3. **Security**: Passwords hashed using `bcrypt` (10 salt rounds); protected routes guarded with JWT; SQL injection prevented via parameterized queries.
4. **Usability**: Fully responsive UI adhering to modern design principles, including visual feedback, toast notifications, loading indicators, and friendly error states.

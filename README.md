# ANGADI HUB - Modern E-Commerce Platform

A fast, responsive, and robust full-stack e-commerce web application with product listings, category search, product details, interactive shopping cart, order checkout with transactional inventory deduction, and customer authentication.

---

## 🌟 Key Features

1. **Product Catalog & Showcase**:
   - Live full-text search with instant debounced queries.
   - Dynamic category filtering with product counts.
   - Flexible sorting by price (low to high / high to low), customer rating, or name.
   - Responsive product cards with star ratings, stock status, and quick "Add to Cart" action.

2. **Product Details Page (`product.html`)**:
   - High-resolution hero image gallery.
   - Breadcrumb navigation (`Home > Category > Product`).
   - Dynamic inventory stock indicators ("In Stock", "Low Stock", "Out of Stock").
   - Interactive quantity stepper bounded by available inventory.
   - One-click "Buy Now" flow and related recommendations.

3. **Hybrid Shopping Cart (`cart.html`)**:
   - Works seamlessly for both guest shoppers (stored in `localStorage`) and authenticated members (persisted in SQLite).
   - Automatic cart merging upon member login.
   - Dynamic real-time cart badge counter across all pages.
   - Free shipping progress calculator ($50 threshold) and 8% estimated tax calculation.

4. **Order Processing & Checkout (`checkout.html`)**:
   - Shipping address validation.
   - Simulated payment processing with instant card format validation.
   - **ACID SQLite Transactions**: atomically verifies stock levels, decrements inventory, creates orders and line-item snapshots, and clears user carts.
   - Order confirmation modal with detailed invoice summary.

5. **Customer Authentication & Orders (`auth.html` & `orders.html`)**:
   - User registration & login with salted `bcrypt` password hashing.
   - Stateless JWT authentication delivered via HTTP headers & cookies.
   - Order history tracking with delivery status badges (`Processing`, `Shipped`, `Delivered`).
   - Built-in 1-click **Demo Account auto-fill** button for instant testing.

6. **Masters & Admin Console (`admin.html`)**:
   - **Product Master**: View all products, search, filter, edit stock/price, delete, and "+ Create New Product" with instant image presets.
   - **Category Master**: View all categories, product counts, and category icon badges.
   - **User Master**: Manage registered users and administrative accounts.
   - **Order Master**: Inspect all store orders, view invoice receipts, and update delivery statuses (`Processing` → `Shipped` → `Delivered`).
   - **Icon Studio & Guide**: Interactive SVG icon reference and copyable snippets for e-commerce icons.

---

## 🛠️ Technology Stack

- **Frontend**: Semantic HTML5, Modern CSS3 (CSS Variables, Flexbox, CSS Grid), Vanilla ES6+ JavaScript.
- **Backend**: Node.js with Express.js 5.x.
- **Database**: SQLite 3 (native `node:sqlite` DatabaseSync engine with WAL mode and foreign keys enabled).
- **Security**: JWT (`jsonwebtoken`) and `bcryptjs` for salted password hashing.

---

## 📁 Project Structure

```
/home/vijay/E-commerce/
├── spec/                          # Technical Specifications
│   ├── 01_architecture_overview.md
│   ├── 02_database_schema.md
│   ├── 03_auth_module.md
│   ├── 04_product_catalog.md
│   ├── 05_cart_module.md
│   ├── 06_order_processing.md
│   ├── 07_frontend_ui.md
│   └── 08_api_documentation.md
├── progress.md                    # Implementation Progress Tracker
├── package.json                   # Dependencies & npm scripts
├── data/
│   └── ecommerce.db               # SQLite database
├── src/
│   ├── server.js                  # Express server entrypoint
│   ├── config/
│   │   └── database.js            # SQLite DDL and data seeding
│   ├── middleware/
│   │   ├── auth.js                # JWT verification & guards
│   │   └── errorHandler.js        # Global error middleware
│   ├── controllers/
│   │   ├── authController.js      # Auth & user profile logic
│   │   ├── productController.js   # Catalog, search, & category logic
│   │   ├── cartController.js      # Cart CRUD & sync operations
│   │   └── orderController.js     # Transactional checkout logic
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   └── orderRoutes.js
│   └── utils/
│       └── seedData.js            # Sample merchandise catalog
├── public/
│   ├── index.html                 # Catalog storefront
│   ├── product.html               # Product detail view
│   ├── cart.html                  # Shopping cart view
│   ├── checkout.html              # Checkout & payment simulation
│   ├── orders.html                # Order history view
│   ├── auth.html                  # Login & registration view
│   ├── css/
│   │   └── styles.css             # Responsive styling system
│   └── js/
│       ├── api.js                 # Central fetch wrapper & toasts
│       ├── auth.js                # Auth state & nav menu
│       ├── cart.js                # Cart persistence & badge counter
│       ├── catalog.js             # Catalog rendering & search
│       ├── product-detail.js      # Single product controller
│       ├── cart-page.js           # Cart page actions
│       ├── checkout.js            # Checkout & invoice controller
│       ├── orders.js              # Order history renderer
│       └── auth-page.js           # Login & registration form controller
└── test/
    ├── api.test.js                # Backend API integration test suite
    └── frontend.test.js           # Frontend assets & routes test suite
```

---

## 🚀 Getting Started

### 1. Start the Server
```bash
npm start
```
The server will start at:
👉 **http://localhost:3000**

### 2. Pre-seeded Demo Account
You can register a new account on `/auth.html` or use the pre-configured demo account:
- **Email**: `demo@example.com`
- **Password**: `password123`
*(A 1-click "Auto-Fill" button is provided on `/auth.html`)*

### 3. Run Automated Tests
```bash
# Run backend API integration tests
node test/api.test.js

# Run frontend assets verification tests
node test/frontend.test.js
```

---

## 📡 RESTful API Reference

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/api/products` | `GET` | List products with `search`, `category`, `sort` | No |
| `/api/products/categories` | `GET` | List product categories with counts | No |
| `/api/products/:id` | `GET` | Retrieve single product with related items | No |
| `/api/auth/register` | `POST` | Register new user account | No |
| `/api/auth/login` | `POST` | Authenticate and issue JWT token | No |
| `/api/auth/me` | `GET` | Fetch authenticated user profile | Yes |
| `/api/cart` | `GET` | Get user's cart and calculated totals | Yes |
| `/api/cart/add` | `POST` | Add product to cart | Yes |
| `/api/cart/update` | `PUT` | Update item quantity in cart | Yes |
| `/api/cart/item/:productId` | `DELETE`| Remove product from cart | Yes |
| `/api/cart/sync` | `POST` | Sync guest cart into user account | Yes |
| `/api/orders/checkout` | `POST` | Process checkout & deduct stock atomically | Yes |
| `/api/orders` | `GET` | Retrieve user's order history | Yes |
| `/api/orders/:id` | `GET` | Retrieve detailed order receipt | Yes |

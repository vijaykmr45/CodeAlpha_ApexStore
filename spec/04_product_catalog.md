# 04 - Product Catalog & Details Specification

## 1. Overview
The Product Catalog module manages listing, search, categorization, sorting, and detail views for all merchandise available in the e-commerce store.

---

## 2. API Endpoints

### 2.1 `GET /api/products`
Retrieves products with support for multi-criteria filtering, search, and sorting.

- **Query Parameters**:
  - `search` (optional string): Full-text search matching `name` or `description`.
  - `category` (optional string): Exact match on product category (e.g., `Electronics`).
  - `sort` (optional string):
    - `price_asc`: Lowest to highest price.
    - `price_desc`: Highest to lowest price.
    - `rating_desc`: Highest customer rating.
    - `newest`: Newest additions first (default).
  - `min_price` (optional number): Filter items priced `>= min_price`.
  - `max_price` (optional number): Filter items priced `<= max_price`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 12,
    "products": [
      {
        "id": 1,
        "name": "Wireless Noise-Canceling Headphones",
        "description": "Premium over-ear headphones with active noise cancellation and 40h battery.",
        "price": 199.99,
        "category": "Audio",
        "image_url": "https://images.unsplash.com/...",
        "stock_quantity": 25,
        "rating": 4.8,
        "created_at": "2026-10-17 10:00:00"
      }
    ]
  }
  ```

---

### 2.2 `GET /api/products/categories`
Returns a list of all distinct product categories and the count of items in each category.

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "categories": [
      { "name": "All", "count": 12 },
      { "name": "Audio", "count": 3 },
      { "name": "Electronics", "count": 4 },
      { "name": "Wearables", "count": 3 },
      { "name": "Accessories", "count": 2 }
    ]
  }
  ```

---

### 2.3 `GET /api/products/:id`
Retrieves full details for a single product by its ID.

- **URL Parameters**: `id` (integer)
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "product": {
      "id": 1,
      "name": "Wireless Noise-Canceling Headphones",
      "description": "Full detailed description...",
      "price": 199.99,
      "category": "Audio",
      "image_url": "https://images.unsplash.com/...",
      "stock_quantity": 25,
      "rating": 4.8,
      "created_at": "2026-10-17 10:00:00"
    }
  }
  ```
- **Error Response**:
  - `404 Not Found`: `{ "error": "Product not found" }`

---

## 3. Frontend Views Specification

### 3.1 Catalog View (`index.html`)
- **Hero Banner**: Engaging welcome banner with quick call-to-action button.
- **Search Bar**: Debounced live text search bar.
- **Filter Controls**:
  - Category pill buttons or dropdown.
  - Sort dropdown (Price: Low to High, Price: High to Low, Best Rating, Newest).
  - Price range indicator / inputs.
- **Product Grid**:
  - Responsive cards with image, category badge, product name, star rating, price, stock status, and "Add to Cart" quick action.
  - Click on card navigates to `product.html?id=:id`.
- **Empty State**: Friendly messaging when no items match the filter criteria.

### 3.2 Product Details View (`product.html`)
- **Breadcrumb Navigation**: Home > Category > Product Name.
- **Hero Image Gallery**: High-resolution primary image display with responsive sizing and fallback placeholder.
- **Product Metadata**:
  - Title, category badge, and customer rating stars.
  - Price with formatted currency symbol.
  - Inventory status: "In Stock (X available)" or "Out of Stock".
- **Interaction Elements**:
  - Numeric quantity selector (bounded between 1 and `stock_quantity`).
  - Primary "Add to Cart" button (disabled when stock is 0).
  - Secondary "Buy Now" button (adds to cart and redirects immediately to checkout).
- **Related Products Section**: Displays up to 4 other items from the same category.

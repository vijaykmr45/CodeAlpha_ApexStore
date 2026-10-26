# 07 - Frontend UI/UX Design Specification

## 1. Design System & Principles
The frontend is built using standard semantic HTML5, modern CSS3 (custom properties, Flexbox, Grid), and Vanilla JavaScript. It delivers a fast, responsive, and aesthetically pleasing storefront that works across all device sizes (mobile, tablet, desktop).

### 1.1 Color Palette
- **Primary**: `#2563eb` (Royal Blue)
- **Primary Hover**: `#1d4ed8`
- **Secondary / Accent**: `#f59e0b` (Amber Gold for ratings & promotions)
- **Success**: `#10b981` (Emerald Green for completed orders & stock available)
- **Danger / Warning**: `#ef4444` (Coral Red for errors, removal, low stock)
- **Background**: `#f8fafc` (Soft off-white / slate 50)
- **Surface / Cards**: `#ffffff` (Pure white with subtle drop shadow)
- **Text Primary**: `#0f172a` (Slate 900)
- **Text Secondary**: `#64748b` (Slate 500)
- **Borders**: `#e2e8f0` (Slate 200)

### 1.2 Typography & Spacing
- **Font Stack**: System UI (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`)
- **Spacing Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px
- **Border Radius**: 6px for inputs/badges, 12px for cards, 9999px for pill buttons.
- **Elevation**:
  - `card-shadow`: `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`
  - `card-shadow-hover`: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)`

---

## 2. Common Reusable Components

### 2.1 Navigation Bar (`<header>`)
- **Logo**: Clickable brand text/icon linking to Home.
- **Search Bar**: Quick search input box with search icon.
- **Navigation Links**: Home / Products, Orders.
- **User Menu**: Shows user name with dropdown (My Orders, Logout) or "Login / Register" button.
- **Cart Button**: Icon with an animated badge displaying the total item count.

### 2.2 Toast Notification System
- Fixed bottom-right notification container.
- Auto-dismissing alerts (3 seconds) for actions like "Item added to cart", "Logged in successfully", "Quantity updated".
- Color coded: green for success, red for error, blue for information.

### 2.3 Modal Component
- Centered overlay with backdrop blur for Order Confirmation and Fast Previews.

---

## 3. Page Layouts & User Flow

| Page | File | Primary Function |
|---|---|---|
| **Catalog / Home** | `index.html` | Hero showcase, category filters, search, product grid |
| **Product Detail** | `product.html` | Full description, gallery, quantity picker, add to cart |
| **Shopping Cart** | `cart.html` | Itemized list, qty modifier, item removal, cost summary |
| **Checkout** | `checkout.html` | Shipping details, payment simulation, order summary |
| **My Orders** | `orders.html` | Order history, line-item breakdown, delivery status |
| **Authentication** | `auth.html` | Tabbed login and registration forms with demo auto-fill |

---

## 4. Responsive Breakpoints
- **Mobile (`< 640px`)**: Single column product grid, collapsed navigation bar, sticky cart summary.
- **Tablet (`640px - 1024px`)**: 2-3 column product grid, standard navbar.
- **Desktop (`> 1024px`)**: 4-column product grid, 2-column checkout with sticky summary sidebar.

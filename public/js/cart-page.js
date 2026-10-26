// Shopping Cart Page Controller

const CartPage = {
  items: [],

  async init() {
    await this.loadCart();
  },

  async loadCart() {
    const listContainer = document.getElementById('cart-items-container');
    const summaryContainer = document.getElementById('cart-summary-container');
    const emptyState = document.getElementById('cart-empty-state');
    const cartLayout = document.getElementById('cart-main-layout');

    if (!listContainer) return;

    this.items = await Cart.getItems();

    if (this.items.length === 0) {
      if (cartLayout) cartLayout.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (cartLayout) cartLayout.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    // Render items table
    listContainer.innerHTML = this.items.map(it => this.renderRow(it)).join('');

    // Render summary
    this.renderSummary();
  },

  renderRow(item) {
    const lineTotal = (item.price * item.quantity).toFixed(2);
    const pid = item.productId || item.product_id;

    return `
      <tr>
        <td class="cart-product-cell">
          <img src="${item.image_url}" alt="${item.name}" class="cart-thumb" loading="lazy" />
          <div>
            <div class="cart-item-title"><a href="/product.html?id=${pid}">${item.name}</a></div>
            <div class="cart-item-cat">${item.category || ''}</div>
            <div style="font-size: 0.88rem; color: var(--text-muted); margin-top: 4px;">Unit: $${item.price.toFixed(2)}</div>
          </div>
        </td>
        <td>
          <div class="quantity-picker" style="transform: scale(0.9); transform-origin: left;">
            <button type="button" class="quantity-btn" onclick="CartPage.changeQuantity(${pid}, -1)">−</button>
            <input 
              type="number" 
              class="quantity-input" 
              value="${item.quantity}" 
              min="1" 
              onchange="CartPage.setQuantity(${pid}, this.value)"
            />
            <button type="button" class="quantity-btn" onclick="CartPage.changeQuantity(${pid}, 1)">+</button>
          </div>
        </td>
        <td style="font-weight: 700; font-size: 1.05rem;">
          $${lineTotal}
        </td>
        <td style="text-align: right;">
          <button class="btn btn-danger btn-sm" onclick="CartPage.removeItem(${pid})" title="Remove item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>
    `;
  },

  renderSummary() {
    const summary = Cart.calculateSummary(this.items);

    document.getElementById('summary-subtotal').textContent = `$${summary.subtotal.toFixed(2)}`;
    document.getElementById('summary-shipping').textContent = summary.shipping === 0 ? 'FREE' : `$${summary.shipping.toFixed(2)}`;
    document.getElementById('summary-tax').textContent = `$${summary.tax.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `$${summary.total.toFixed(2)}`;

    const freeShippingProgress = document.getElementById('free-shipping-note');
    if (freeShippingProgress) {
      if (summary.subtotal >= 50) {
        freeShippingProgress.innerHTML = `<span style="color: var(--success); font-weight: 600;">🎉 You qualified for FREE Standard Delivery!</span>`;
      } else {
        const diff = (50 - summary.subtotal).toFixed(2);
        freeShippingProgress.innerHTML = `Add <strong>$${diff}</strong> more to get <strong>FREE shipping</strong>!`;
      }
    }
  },

  async changeQuantity(productId, delta) {
    const item = this.items.find(it => (it.productId || it.product_id) === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      await this.removeItem(productId);
    } else {
      await Cart.updateQuantity(productId, newQty);
      await this.loadCart();
    }
  },

  async setQuantity(productId, value) {
    const qty = parseInt(value, 10);
    if (isNaN(qty) || qty <= 0) {
      await this.removeItem(productId);
    } else {
      await Cart.updateQuantity(productId, qty);
      await this.loadCart();
    }
  },

  async removeItem(productId) {
    await Cart.removeItem(productId);
    await this.loadCart();
  },

  proceedToCheckout() {
    window.location.href = '/checkout.html';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CartPage.init();
});

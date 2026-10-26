// Cart State & Persistence Management

const Cart = {
  getGuestCart() {
    try {
      const stored = localStorage.getItem('guest_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveGuestCart(items) {
    localStorage.setItem('guest_cart', JSON.stringify(items));
  },

  async getItems() {
    if (window.Auth && window.Auth.isLoggedIn()) {
      try {
        const data = await API.get('/cart');
        return data.items || [];
      } catch (err) {
        console.error('Failed to load user cart from server, using local fallback:', err);
        return this.getGuestCart();
      }
    } else {
      return this.getGuestCart();
    }
  },

  async addItem(product, quantity = 1) {
    quantity = parseInt(quantity, 10) || 1;

    if (window.Auth && window.Auth.isLoggedIn()) {
      try {
        const data = await API.post('/cart/add', {
          productId: product.id,
          quantity
        });
        showToast(data.message || `Added ${product.name} to cart`, 'success');
        await this.refreshBadge();
        return;
      } catch (err) {
        showToast(err.message || 'Could not add to cart', 'error');
        throw err;
      }
    }

    // Guest Cart
    const items = this.getGuestCart();
    const existing = items.find(it => it.productId === product.id);

    if (existing) {
      if (existing.quantity + quantity > product.stock_quantity) {
        showToast(`Only ${product.stock_quantity} available in stock`, 'error');
        return;
      }
      existing.quantity += quantity;
      existing.lineTotal = parseFloat((existing.quantity * existing.price).toFixed(2));
    } else {
      if (quantity > product.stock_quantity) {
        showToast(`Only ${product.stock_quantity} available in stock`, 'error');
        return;
      }
      items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
        stock_quantity: product.stock_quantity,
        quantity,
        lineTotal: parseFloat((quantity * product.price).toFixed(2))
      });
    }

    this.saveGuestCart(items);
    showToast(`Added ${product.name} to cart`, 'success');
    await this.refreshBadge();
  },

  async updateQuantity(productId, quantity) {
    productId = parseInt(productId, 10);
    quantity = parseInt(quantity, 10);

    if (window.Auth && window.Auth.isLoggedIn()) {
      try {
        await API.put('/cart/update', { productId, quantity });
        await this.refreshBadge();
        return;
      } catch (err) {
        showToast(err.message || 'Could not update cart', 'error');
        throw err;
      }
    }

    let items = this.getGuestCart();
    if (quantity <= 0) {
      items = items.filter(it => it.productId !== productId);
    } else {
      const item = items.find(it => it.productId === productId);
      if (item) {
        if (quantity > item.stock_quantity) {
          showToast(`Only ${item.stock_quantity} available in stock`, 'error');
          return;
        }
        item.quantity = quantity;
        item.lineTotal = parseFloat((item.quantity * item.price).toFixed(2));
      }
    }

    this.saveGuestCart(items);
    await this.refreshBadge();
  },

  async removeItem(productId) {
    productId = parseInt(productId, 10);

    if (window.Auth && window.Auth.isLoggedIn()) {
      try {
        await API.delete(`/cart/item/${productId}`);
        showToast('Item removed from cart', 'info');
        await this.refreshBadge();
        return;
      } catch (err) {
        showToast(err.message || 'Could not remove item', 'error');
        throw err;
      }
    }

    let items = this.getGuestCart();
    items = items.filter(it => it.productId !== productId);
    this.saveGuestCart(items);
    showToast('Item removed from cart', 'info');
    await this.refreshBadge();
  },

  async clear() {
    if (window.Auth && window.Auth.isLoggedIn()) {
      try {
        await API.delete('/cart/clear');
      } catch (e) {}
    }
    this.saveGuestCart([]);
    await this.refreshBadge();
  },

  async syncOnLogin() {
    const guestItems = this.getGuestCart();
    if (guestItems.length > 0) {
      try {
        await API.post('/cart/sync', {
          localItems: guestItems.map(it => ({
            productId: it.productId,
            quantity: it.quantity
          }))
        });
        this.saveGuestCart([]);
      } catch (err) {
        console.error('Failed to sync guest cart:', err);
      }
    }
    await this.refreshBadge();
  },

  async refreshBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    let count = 0;
    const items = await this.getItems();
    count = items.reduce((sum, it) => sum + (it.quantity || 1), 0);

    badge.textContent = count;
    badge.classList.remove('bump');
    void badge.offsetWidth; // trigger reflow
    badge.classList.add('bump');
  },

  calculateSummary(items) {
    let subtotal = 0;
    let count = 0;

    for (const it of items) {
      const lineTotal = parseFloat((it.price * it.quantity).toFixed(2));
      subtotal += lineTotal;
      count += it.quantity;
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const shipping = subtotal === 0 ? 0 : (subtotal >= 50 ? 0 : 9.99);
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const total = parseFloat((subtotal + shipping + tax).toFixed(2));

    return { subtotal, shipping, tax, total, count };
  }
};

window.Cart = Cart;

document.addEventListener('DOMContentLoaded', () => {
  Cart.refreshBadge();
});

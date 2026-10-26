// Checkout Page Controller

const Checkout = {
  items: [],
  summary: null,

  async init() {
    this.items = await Cart.getItems();

    if (!this.items || this.items.length === 0) {
      showToast('Your cart is empty. Redirecting to cart...', 'info');
      setTimeout(() => {
        window.location.href = '/cart.html';
      }, 1000);
      return;
    }

    this.renderOrderPreview();
    this.prefillUserInfo();

    const form = document.getElementById('checkout-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleCheckoutSubmit(e));
    }
  },

  prefillUserInfo() {
    const user = Auth.getUser();
    if (user) {
      const nameInput = document.getElementById('shipping-name');
      if (nameInput && !nameInput.value) {
        nameInput.value = user.name;
      }
    } else {
      const banner = document.getElementById('guest-auth-prompt');
      if (banner) banner.style.display = 'block';
    }
  },

  renderOrderPreview() {
    this.summary = Cart.calculateSummary(this.items);

    const itemsContainer = document.getElementById('checkout-items-list');
    if (itemsContainer) {
      itemsContainer.innerHTML = this.items.map(it => `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 0.9rem;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${it.image_url}" alt="${it.name}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover; background: #eee;" />
            <div>
              <div style="font-weight: 600; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${it.name}</div>
              <div style="color: var(--text-muted); font-size: 0.8rem;">Qty: ${it.quantity} × $${it.price.toFixed(2)}</div>
            </div>
          </div>
          <div style="font-weight: 700;">$${(it.price * it.quantity).toFixed(2)}</div>
        </div>
      `).join('');
    }

    document.getElementById('co-subtotal').textContent = `$${this.summary.subtotal.toFixed(2)}`;
    document.getElementById('co-shipping').textContent = this.summary.shipping === 0 ? 'FREE' : `$${this.summary.shipping.toFixed(2)}`;
    document.getElementById('co-tax').textContent = `$${this.summary.tax.toFixed(2)}`;
    document.getElementById('co-total').textContent = `$${this.summary.total.toFixed(2)}`;
  },

  async handleCheckoutSubmit(e) {
    e.preventDefault();

    // Check if user is logged in
    if (!Auth.isLoggedIn()) {
      showToast('Please sign in or register to complete your order', 'info');
      // Store checkout intention and redirect to auth
      sessionStorage.setItem('redirect_after_auth', '/checkout.html');
      setTimeout(() => {
        window.location.href = '/auth.html';
      }, 1200);
      return;
    }

    const submitBtn = document.getElementById('place-order-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Processing Order...</span>';

    try {
      const shipping = {
        name: document.getElementById('shipping-name').value.trim(),
        address: document.getElementById('shipping-address').value.trim(),
        city: document.getElementById('shipping-city').value.trim(),
        postalCode: document.getElementById('shipping-zip').value.trim(),
        phone: document.getElementById('shipping-phone').value.trim()
      };

      const payment = {
        cardNumber: document.getElementById('card-number').value.replace(/\s+/g, ''),
        expiry: document.getElementById('card-expiry').value.trim(),
        cvv: document.getElementById('card-cvv').value.trim()
      };

      const payload = {
        shipping,
        payment,
        items: this.items.map(it => ({
          productId: it.productId || it.product_id,
          quantity: it.quantity
        }))
      };

      const res = await API.post('/orders/checkout', payload);

      if (res.success && res.order) {
        // Clear local cart
        await Cart.clear();

        // Show Confirmation Modal
        this.showConfirmationModal(res.order);
      }
    } catch (err) {
      showToast(err.message || 'Failed to place order. Please check inputs.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Complete Purchase & Place Order</span>';
    }
  },

  showConfirmationModal(order) {
    const modal = document.getElementById('confirmation-modal');
    if (!modal) return;

    document.getElementById('conf-order-id').textContent = `#${order.id}`;
    document.getElementById('conf-order-total').textContent = `$${order.totalAmount.toFixed(2)}`;
    document.getElementById('conf-shipping-address').textContent = `${order.shipping.name}, ${order.shipping.address}, ${order.shipping.city} ${order.shipping.postalCode}`;
    
    modal.classList.add('active');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Checkout.init();
});

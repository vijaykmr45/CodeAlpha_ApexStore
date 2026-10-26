// Order History Page Controller

const OrdersPage = {
  orders: [],

  async init() {
    const container = document.getElementById('orders-list-container');
    const authPrompt = document.getElementById('orders-auth-prompt');
    const emptyState = document.getElementById('orders-empty-state');

    if (!Auth.isLoggedIn()) {
      if (authPrompt) authPrompt.style.display = 'block';
      if (container) container.style.display = 'none';
      if (emptyState) emptyState.style.display = 'none';
      return;
    }

    if (authPrompt) authPrompt.style.display = 'none';

    try {
      const data = await API.get('/orders');
      this.orders = data.orders || [];

      if (this.orders.length === 0) {
        if (container) container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';
      if (container) {
        container.style.display = 'block';
        container.innerHTML = this.orders.map(order => this.renderOrderCard(order)).join('');
      }
    } catch (err) {
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; color: var(--danger); padding: 40px;">
            Failed to load orders. Please make sure you are signed in.
          </div>
        `;
      }
    }
  },

  renderOrderCard(order) {
    const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusBadgeClass = 
      order.status === 'Delivered' ? 'badge-success' :
      order.status === 'Shipped' ? 'badge-primary' : 'badge-warning';

    const itemsHtml = (order.items || []).map(item => `
      <div class="order-item-row">
        <div>
          <span style="font-weight: 600; color: var(--text-main);">${item.product_name}</span>
          <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 8px;">× ${item.quantity}</span>
        </div>
        <div style="font-weight: 700;">$${item.subtotal.toFixed(2)}</div>
      </div>
    `).join('');

    return `
      <div class="order-card" id="order-${order.id}">
        <div class="order-header">
          <div>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">
              Order #${order.id}
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
              Placed on ${formattedDate}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <span class="badge ${statusBadgeClass}">${order.status}</span>
            <div style="font-size: 1.3rem; font-weight: 800; color: var(--primary);">
              $${order.total_amount.toFixed(2)}
            </div>
          </div>
        </div>

        <!-- Shipping & Payment Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: var(--bg-alt); padding: 12px 16px; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 16px;">
          <div>
            <span style="color: var(--text-muted); display: block; font-size: 0.78rem; text-transform: uppercase; font-weight: 700;">Delivering To:</span>
            <strong>${order.shipping_name}</strong><br>
            ${order.shipping_address}, ${order.shipping_city} ${order.shipping_postal_code}
          </div>
          <div>
            <span style="color: var(--text-muted); display: block; font-size: 0.78rem; text-transform: uppercase; font-weight: 700;">Payment Method:</span>
            ${order.payment_method || 'Credit Card'}
          </div>
        </div>

        <!-- Purchased Line Items -->
        <div style="padding-top: 8px;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">
            Items in Order (${order.total_items || (order.items || []).length}):
          </div>
          <div class="order-items-list">
            ${itemsHtml}
          </div>
        </div>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  OrdersPage.init();
});

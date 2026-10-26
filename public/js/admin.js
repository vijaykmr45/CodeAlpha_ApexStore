// Admin & Masters Management Controller

const Admin = {
  currentTab: 'products',
  products: [],
  categories: [],
  users: [],
  orders: [],

  // Preset high quality sample image options for quick product creation
  imagePresets: [
    { label: '🎧 Audio', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80' },
    { label: '⌚ Smartwatch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' },
    { label: '📷 Camera', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80' },
    { label: '⌨️ Keyboard', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80' },
    { label: '🔊 Speaker', url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80' },
    { label: '🖱️ Mouse', url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80' },
    { label: '💻 Laptop', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80' },
    { label: '🖥️ Monitor', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80' }
  ],

  async init() {
    this.bindEvents();
    this.renderImagePresets();
    await this.loadAllMasters();
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.admin-tab-content').forEach(panel => {
      panel.style.display = panel.id === `tab-${tabId}` ? 'block' : 'none';
    });
  },

  bindEvents() {
    const createForm = document.getElementById('create-product-form');
    if (createForm) {
      createForm.addEventListener('submit', (e) => this.handleCreateProduct(e));
    }

    const editForm = document.getElementById('edit-product-form');
    if (editForm) {
      editForm.addEventListener('submit', (e) => this.handleUpdateProduct(e));
    }

    const searchInput = document.getElementById('admin-product-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = this.products.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.category.toLowerCase().includes(query) ||
          p.id.toString() === query
        );
        this.renderProductsTable(filtered);
      });
    }

    // Image URL preview on input
    const imgInput = document.getElementById('new-prod-image');
    if (imgInput) {
      imgInput.addEventListener('input', (e) => {
        const preview = document.getElementById('new-prod-preview');
        if (preview) preview.src = e.target.value;
      });
    }
  },

  renderImagePresets() {
    const container = document.getElementById('image-preset-buttons');
    if (!container) return;

    container.innerHTML = this.imagePresets.map(preset => `
      <button 
        type="button" 
        class="btn btn-secondary btn-sm" 
        style="padding: 4px 8px; font-size: 0.8rem;"
        onclick="Admin.selectImagePreset('${preset.url}')">
        ${preset.label}
      </button>
    `).join('');
  },

  selectImagePreset(url) {
    const input = document.getElementById('new-prod-image');
    const preview = document.getElementById('new-prod-preview');
    if (input) input.value = url;
    if (preview) preview.src = url;
  },

  async loadAllMasters() {
    await Promise.all([
      this.loadProductMaster(),
      this.loadCategoryMaster(),
      this.loadUserMaster(),
      this.loadOrderMaster()
    ]);
  },

  // ==========================================
  // 1. PRODUCT MASTER
  // ==========================================
  async loadProductMaster() {
    const tbody = document.getElementById('admin-products-table');
    if (!tbody) return;

    try {
      const data = await API.get('/products?sort=newest');
      this.products = data.products || [];
      this.renderProductsTable(this.products);
      document.getElementById('total-product-count').textContent = this.products.length;
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load products: ${err.message}</td></tr>`;
    }
  },

  renderProductsTable(list) {
    const tbody = document.getElementById('admin-products-table');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">No products found.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(p => `
      <tr>
        <td style="font-weight: 700; color: var(--text-muted);">#${p.id}</td>
        <td>
          <img src="${p.image_url}" alt="${p.name}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover; background: #eee;" />
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${p.name}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.description}</div>
        </td>
        <td><span class="badge badge-primary">${p.category}</span></td>
        <td style="font-weight: 700; color: var(--text-main);">$${p.price.toFixed(2)}</td>
        <td>
          ${p.stock_quantity > 0 
            ? `<span class="badge badge-success">${p.stock_quantity} in stock</span>`
            : `<span class="badge badge-danger">Out of Stock</span>`
          }
        </td>
        <td>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="Admin.openEditModal(${p.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="Admin.deleteProduct(${p.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openCreateModal() {
    const modal = document.getElementById('modal-create-product');
    if (modal) {
      document.getElementById('create-product-form').reset();
      this.selectImagePreset(this.imagePresets[0].url);
      modal.classList.add('active');
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  async handleCreateProduct(e) {
    e.preventDefault();

    const payload = {
      name: document.getElementById('new-prod-name').value.trim(),
      category: document.getElementById('new-prod-category').value.trim(),
      price: parseFloat(document.getElementById('new-prod-price').value),
      stock_quantity: parseInt(document.getElementById('new-prod-stock').value, 10),
      rating: parseFloat(document.getElementById('new-prod-rating').value) || 4.5,
      image_url: document.getElementById('new-prod-image').value.trim(),
      description: document.getElementById('new-prod-description').value.trim()
    };

    try {
      const res = await API.post('/products', payload);
      showToast(`Product "${res.product.name}" created successfully!`, 'success');
      this.closeModal('modal-create-product');
      await this.loadProductMaster();
      await this.loadCategoryMaster();
    } catch (err) {
      showToast(err.message || 'Failed to create product', 'error');
    }
  },

  openEditModal(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('edit-prod-id').value = product.id;
    document.getElementById('edit-prod-name').value = product.name;
    document.getElementById('edit-prod-category').value = product.category;
    document.getElementById('edit-prod-price').value = product.price;
    document.getElementById('edit-prod-stock').value = product.stock_quantity;
    document.getElementById('edit-prod-rating').value = product.rating;
    document.getElementById('edit-prod-image').value = product.image_url;
    document.getElementById('edit-prod-description').value = product.description;

    const modal = document.getElementById('modal-edit-product');
    if (modal) modal.classList.add('active');
  },

  async handleUpdateProduct(e) {
    e.preventDefault();

    const productId = document.getElementById('edit-prod-id').value;
    const payload = {
      name: document.getElementById('edit-prod-name').value.trim(),
      category: document.getElementById('edit-prod-category').value.trim(),
      price: parseFloat(document.getElementById('edit-prod-price').value),
      stock_quantity: parseInt(document.getElementById('edit-prod-stock').value, 10),
      rating: parseFloat(document.getElementById('edit-prod-rating').value),
      image_url: document.getElementById('edit-prod-image').value.trim(),
      description: document.getElementById('edit-prod-description').value.trim()
    };

    try {
      await API.put(`/products/${productId}`, payload);
      showToast('Product updated successfully!', 'success');
      this.closeModal('modal-edit-product');
      await this.loadProductMaster();
      await this.loadCategoryMaster();
    } catch (err) {
      showToast(err.message || 'Failed to update product', 'error');
    }
  },

  async deleteProduct(productId) {
    if (!confirm(`Are you sure you want to delete Product #${productId}?`)) return;

    try {
      await API.delete(`/products/${productId}`);
      showToast('Product deleted successfully', 'info');
      await this.loadProductMaster();
      await this.loadCategoryMaster();
    } catch (err) {
      showToast(err.message || 'Cannot delete product', 'error');
    }
  },

  // ==========================================
  // 2. CATEGORY MASTER
  // ==========================================
  async loadCategoryMaster() {
    const container = document.getElementById('admin-categories-cards');
    if (!container) return;

    try {
      const data = await API.get('/products/categories');
      this.categories = (data.categories || []).filter(c => c.name !== 'All');

      // Category Icon Map
      const iconMap = {
        'Audio': '🎧',
        'Wearables': '⌚',
        'Electronics': '💻',
        'Accessories': '🖱️',
        'Gaming': '🎮',
        'Cameras': '📷',
        'Mobile': '📱',
        'Home': '🏠'
      };

      container.innerHTML = this.categories.map(cat => {
        const icon = iconMap[cat.name] || '📦';
        return `
          <div class="cart-card" style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="font-size: 2rem; background: var(--bg-alt); width: 50px; height: 50px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                ${icon}
              </div>
              <div>
                <h4 style="font-size: 1.1rem; font-weight: 700;">${cat.name}</h4>
                <span style="color: var(--text-muted); font-size: 0.88rem;">${cat.count} product(s) in catalog</span>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="Admin.filterByCat('${cat.name}')">View Products</button>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  },

  filterByCat(category) {
    this.switchTab('products');
    const searchInput = document.getElementById('admin-product-search');
    if (searchInput) {
      searchInput.value = category;
      searchInput.dispatchEvent(new Event('input'));
    }
  },

  // ==========================================
  // 3. USER MASTER
  // ==========================================
  async loadUserMaster() {
    const tbody = document.getElementById('admin-users-table');
    if (!tbody) return;

    try {
      const data = await API.get('/auth/users');
      this.users = data.users || [];
      document.getElementById('total-user-count').textContent = this.users.length;

      tbody.innerHTML = this.users.map(u => `
        <tr>
          <td style="font-weight: 700; color: var(--text-muted);">#${u.id}</td>
          <td style="font-weight: 600;">${u.name}</td>
          <td><code>${u.email}</code></td>
          <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">${u.role}</span></td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${new Date(u.created_at).toLocaleDateString()}</td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">Failed to load users</td></tr>`;
    }
  },

  // ==========================================
  // 4. ORDER MASTER
  // ==========================================
  async loadOrderMaster() {
    const tbody = document.getElementById('admin-orders-table');
    if (!tbody) return;

    try {
      const data = await API.get('/orders/all');
      this.orders = data.orders || [];
      document.getElementById('total-order-count').textContent = this.orders.length;

      if (this.orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">No orders recorded yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = this.orders.map(o => `
        <tr>
          <td style="font-weight: 800; color: var(--primary);">#${o.id}</td>
          <td>
            <strong>${o.user_name}</strong><br>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${o.user_email}</span>
          </td>
          <td style="font-size: 0.88rem;">
            ${o.shipping_name}, ${o.shipping_city}
          </td>
          <td style="font-weight: 800; font-size: 1.05rem;">$${o.total_amount.toFixed(2)}</td>
          <td>
            <select class="sort-select" style="padding: 4px 8px; font-size: 0.85rem;" onchange="Admin.updateOrderStatus(${o.id}, this.value)">
              <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
              <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${new Date(o.created_at).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="Admin.viewOrderReceipt(${o.id})">Receipt</button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load orders</td></tr>`;
    }
  },

  async updateOrderStatus(orderId, newStatus) {
    try {
      await API.put(`/orders/${orderId}/status`, { status: newStatus });
      showToast(`Order #${orderId} status updated to "${newStatus}"`, 'success');
      await this.loadOrderMaster();
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  },

  viewOrderReceipt(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('modal-order-receipt');
    const content = document.getElementById('receipt-modal-content');

    const itemsHtml = (order.items || []).map(item => `
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--border); font-size: 0.9rem;">
        <div>
          <strong>${item.product_name}</strong>
          <span style="color: var(--text-muted);"> × ${item.quantity}</span>
        </div>
        <div style="font-weight: 700;">$${item.subtotal.toFixed(2)}</div>
      </div>
    `).join('');

    content.innerHTML = `
      <div style="text-align: left; margin-bottom: 16px;">
        <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 4px;">Invoice Receipt #${order.id}</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Date: ${new Date(order.created_at).toLocaleString()}</p>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Status: <span class="badge badge-primary">${order.status}</span></p>
      </div>

      <div style="background: var(--bg-alt); padding: 12px; border-radius: var(--radius-md); text-align: left; margin-bottom: 16px; font-size: 0.88rem;">
        <strong>Customer:</strong> ${order.user_name} (${order.user_email})<br>
        <strong>Shipping Address:</strong> ${order.shipping_name}, ${order.shipping_address}, ${order.shipping_city}<br>
        <strong>Payment:</strong> ${order.payment_method}
      </div>

      <div style="margin-bottom: 16px;">
        ${itemsHtml}
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 800; padding-top: 8px; border-top: 2px solid var(--border);">
        <span>Total:</span>
        <span style="color: var(--primary);">$${order.total_amount.toFixed(2)}</span>
      </div>
    `;

    modal.classList.add('active');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
});

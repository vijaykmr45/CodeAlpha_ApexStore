// Product Detail Page Controller

const ProductDetail = {
  product: null,
  quantity: 1,

  async init() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
      this.renderNotFound();
      return;
    }

    try {
      const data = await API.get(`/products/${productId}`);
      this.product = data.product;
      this.renderProduct(data.product);
      this.renderRelated(data.related || []);
    } catch (err) {
      console.error('Failed to load product:', err);
      this.renderNotFound();
    }
  },

  renderProduct(p) {
    document.title = `${p.name} - ApexStore`;

    // Breadcrumbs
    const bcCategory = document.getElementById('bc-category');
    const bcTitle = document.getElementById('bc-title');
    if (bcCategory) bcCategory.textContent = p.category;
    if (bcTitle) bcTitle.textContent = p.name;

    // Gallery Image
    const imgEl = document.getElementById('detail-image');
    if (imgEl) {
      imgEl.src = p.image_url;
      imgEl.alt = p.name;
    }

    // Info
    document.getElementById('detail-category').textContent = p.category;
    document.getElementById('detail-title').textContent = p.name;
    document.getElementById('detail-price').textContent = `$${p.price.toFixed(2)}`;
    document.getElementById('detail-description').textContent = p.description;

    // Rating
    const stars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));
    document.getElementById('detail-rating-stars').textContent = stars;
    document.getElementById('detail-rating-num').textContent = `${p.rating.toFixed(1)} / 5.0`;

    // Stock Status
    const stockEl = document.getElementById('detail-stock');
    const addBtn = document.getElementById('add-to-cart-btn');
    const buyBtn = document.getElementById('buy-now-btn');
    const qtyInput = document.getElementById('qty-input');

    if (p.stock_quantity > 10) {
      stockEl.innerHTML = `<span class="badge badge-success">In Stock</span> <span>${p.stock_quantity} units available</span>`;
    } else if (p.stock_quantity > 0) {
      stockEl.innerHTML = `<span class="badge badge-warning">Low Stock</span> <span style="color: #b45309; font-weight: 600;">Only ${p.stock_quantity} left in stock - order soon!</span>`;
    } else {
      stockEl.innerHTML = `<span class="badge badge-danger">Out of Stock</span> <span>Currently unavailable</span>`;
      if (addBtn) addBtn.disabled = true;
      if (buyBtn) buyBtn.disabled = true;
      if (qtyInput) qtyInput.disabled = true;
    }
  },

  changeQuantity(delta) {
    if (!this.product || this.product.stock_quantity <= 0) return;

    let newQty = this.quantity + delta;
    if (newQty < 1) newQty = 1;
    if (newQty > this.product.stock_quantity) {
      newQty = this.product.stock_quantity;
      showToast(`Maximum ${this.product.stock_quantity} items available`, 'info');
    }

    this.quantity = newQty;
    const input = document.getElementById('qty-input');
    if (input) input.value = this.quantity;
  },

  onQuantityInput(e) {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (this.product && val > this.product.stock_quantity) {
      val = this.product.stock_quantity;
      showToast(`Maximum ${this.product.stock_quantity} items available`, 'info');
    }
    this.quantity = val;
    e.target.value = val;
  },

  async addToCart() {
    if (!this.product || this.product.stock_quantity <= 0) return;
    await Cart.addItem(this.product, this.quantity);
  },

  async buyNow() {
    if (!this.product || this.product.stock_quantity <= 0) return;
    await Cart.addItem(this.product, this.quantity);
    window.location.href = '/checkout.html';
  },

  renderRelated(relatedList) {
    const container = document.getElementById('related-products-grid');
    if (!container) return;

    if (relatedList.length === 0) {
      container.parentElement.style.display = 'none';
      return;
    }

    container.innerHTML = relatedList.map(item => `
      <div class="product-card">
        <div class="card-image-wrap" style="height: 180px;">
          <a href="/product.html?id=${item.id}">
            <img src="${item.image_url}" alt="${item.name}" class="card-image" loading="lazy">
          </a>
        </div>
        <div class="card-body">
          <span class="card-category">${item.category}</span>
          <h4 class="card-title" style="font-size: 0.95rem;">
            <a href="/product.html?id=${item.id}">${item.name}</a>
          </h4>
          <div class="card-footer">
            <div class="card-price" style="font-size: 1.15rem;">$${item.price.toFixed(2)}</div>
            <a href="/product.html?id=${item.id}" class="btn btn-secondary btn-sm">View</a>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderNotFound() {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h2 class="empty-title">Product Not Found</h2>
          <p class="empty-desc">The requested product could not be located in our catalog.</p>
          <a href="/index.html" class="btn btn-primary">Return to Catalog</a>
        </div>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ProductDetail.init();
});

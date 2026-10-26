// Catalog Page Controller

const Catalog = {
  activeCategory: 'All',
  searchQuery: '',
  activeSort: 'newest',
  products: [],

  async init() {
    this.bindEvents();
    await this.loadCategories();
    await this.fetchAndRenderProducts();
  },

  bindEvents() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.fetchAndRenderProducts();
        }, 300);
      });
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.activeSort = e.target.value;
        this.fetchAndRenderProducts();
      });
    }
  },

  async loadCategories() {
    const container = document.getElementById('category-pills');
    if (!container) return;

    try {
      const data = await API.get('/products/categories');
      if (data.categories) {
        container.innerHTML = data.categories.map(cat => `
          <button 
            class="category-pill ${cat.name === this.activeCategory ? 'active' : ''}" 
            data-category="${cat.name}"
            onclick="Catalog.selectCategory('${cat.name}')">
            ${cat.name} (${cat.count})
          </button>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  },

  selectCategory(category) {
    this.activeCategory = category;
    
    // Update active class on buttons
    document.querySelectorAll('.category-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });

    this.fetchAndRenderProducts();
  },

  async fetchAndRenderProducts() {
    const grid = document.getElementById('product-grid');
    const countLabel = document.getElementById('products-count');
    if (!grid) return;

    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px;">
        <div style="font-size: 1.1rem; color: var(--text-muted);">Loading products...</div>
      </div>
    `;

    try {
      const params = {
        category: this.activeCategory,
        sort: this.activeSort
      };
      if (this.searchQuery) {
        params.search = this.searchQuery;
      }

      const data = await API.get('/products', params);
      this.products = data.products || [];

      if (countLabel) {
        countLabel.textContent = `Showing ${this.products.length} product${this.products.length === 1 ? '' : 's'}`;
      }

      if (this.products.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1;">
            <div class="empty-icon">🔍</div>
            <div class="empty-title">No products found</div>
            <div class="empty-desc">We couldn't find any products matching your criteria. Try adjusting your search or category filter.</div>
            <button class="btn btn-secondary" onclick="Catalog.resetFilters()">Clear Filters</button>
          </div>
        `;
        return;
      }

      grid.innerHTML = this.products.map(p => this.renderProductCard(p)).join('');
    } catch (err) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--danger);">
          Failed to load products. Please check server connection.
        </div>
      `;
    }
  },

  renderProductCard(p) {
    const isOutOfStock = p.stock_quantity <= 0;
    const ratingStars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));

    return `
      <div class="product-card" id="product-${p.id}">
        <div class="card-image-wrap">
          <a href="/product.html?id=${p.id}">
            <img 
              src="${p.image_url}" 
              alt="${p.name}" 
              class="card-image"
              loading="lazy"
              onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'220\\' viewBox=\\'0 0 300 220\\'><rect width=\\'300\\' height=\\'220\\' fill=\\'%23f1f5f9\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%2394a3b8\\' font-family=\\'sans-serif\\' font-size=\\'16\\'>Product Image</text></svg>';"
            />
          </a>
        </div>
        <div class="card-body">
          <span class="card-category">${p.category}</span>
          <h3 class="card-title">
            <a href="/product.html?id=${p.id}">${p.name}</a>
          </h3>
          <div class="card-rating">
            <span>${ratingStars}</span>
            <span class="card-rating-num">${p.rating.toFixed(1)}</span>
          </div>
          <div class="card-footer">
            <div class="card-price">$${p.price.toFixed(2)}</div>
            ${isOutOfStock 
              ? `<span class="badge badge-danger">Out of Stock</span>`
              : `<button class="card-add-btn" onclick="Catalog.handleAddToCart(${p.id})">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                  <span>Add</span>
                 </button>`
            }
          </div>
        </div>
      </div>
    `;
  },

  handleAddToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      Cart.addItem(product, 1);
    }
  },

  resetFilters() {
    this.activeCategory = 'All';
    this.searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    this.selectCategory('All');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Catalog.init();
});

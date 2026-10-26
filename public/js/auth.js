// Authentication & User State Management

const Auth = {
  getUser() {
    try {
      const u = localStorage.getItem('auth_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('auth_token');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  saveAuth(token, user) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  async login(email, password) {
    try {
      const data = await API.post('/auth/login', { email, password });
      this.saveAuth(data.token, data.user);
      
      // Sync guest cart to server
      if (window.Cart && typeof window.Cart.syncOnLogin === 'function') {
        await window.Cart.syncOnLogin();
      }

      this.renderAuthNav();
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      return data;
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  },

  async register(name, email, password) {
    try {
      const data = await API.post('/auth/register', { name, email, password });
      this.saveAuth(data.token, data.user);

      if (window.Cart && typeof window.Cart.syncOnLogin === 'function') {
        await window.Cart.syncOnLogin();
      }

      this.renderAuthNav();
      showToast('Registration successful! Welcome.', 'success');
      return data;
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  },

  async logout() {
    try {
      await API.post('/auth/logout', {});
    } catch (e) {
      // Ignore network error on logout
    }
    this.clearAuth();
    this.renderAuthNav();
    if (window.Cart && typeof window.Cart.refresh === 'function') {
      window.Cart.refresh();
    }
    showToast('Logged out successfully', 'info');
    if (window.location.pathname.includes('orders.html') || window.location.pathname.includes('checkout.html')) {
      window.location.href = '/index.html';
    }
  },

  renderAuthNav() {
    const container = document.getElementById('user-nav-container');
    if (!container) return;

    const user = this.getUser();

    if (user) {
      container.innerHTML = `
        <div class="user-menu">
          <a href="/admin.html" class="nav-link" title="Master Data & Admin Console">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Masters</span>
          </a>
          <a href="/orders.html" class="nav-link" title="View Orders">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span>Orders</span>
          </a>
          <span class="user-name-tag">👋 ${user.name.split(' ')[0]}</span>
          <button id="logout-btn" class="btn btn-secondary btn-sm" onclick="Auth.logout()">Logout</button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <a href="/admin.html" class="nav-link" title="Master Data & Admin Console">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Masters</span>
          </a>
          <a href="/auth.html" class="btn btn-primary btn-sm">
            <span>Sign In / Register</span>
          </a>
        </div>
      `;
    }
  }
};

window.Auth = Auth;
document.addEventListener('DOMContentLoaded', () => {
  Auth.renderAuthNav();
});

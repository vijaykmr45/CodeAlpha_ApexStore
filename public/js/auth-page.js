// Authentication Page Controller

const AuthPage = {
  currentTab: 'login',

  init() {
    this.bindEvents();

    // Check if user is already logged in
    if (Auth.isLoggedIn()) {
      showToast('You are already logged in!', 'info');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1000);
    }
  },

  switchTab(tab) {
    this.currentTab = tab;

    document.getElementById('tab-login-btn').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register-btn').classList.toggle('active', tab === 'register');

    document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
  },

  bindEvents() {
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        const btn = document.getElementById('login-submit-btn');
        btn.disabled = true;
        btn.textContent = 'Signing in...';

        try {
          await Auth.login(email, password);
          const redirect = sessionStorage.getItem('redirect_after_auth') || '/index.html';
          sessionStorage.removeItem('redirect_after_auth');
          setTimeout(() => {
            window.location.href = redirect;
          }, 800);
        } catch (err) {
          btn.disabled = false;
          btn.textContent = 'Sign In';
        }
      });
    }

    const registerForm = document.getElementById('form-register');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;

        const btn = document.getElementById('reg-submit-btn');
        btn.disabled = true;
        btn.textContent = 'Creating account...';

        try {
          await Auth.register(name, email, password);
          const redirect = sessionStorage.getItem('redirect_after_auth') || '/index.html';
          sessionStorage.removeItem('redirect_after_auth');
          setTimeout(() => {
            window.location.href = redirect;
          }, 800);
        } catch (err) {
          btn.disabled = false;
          btn.textContent = 'Create Account';
        }
      });
    }
  },

  fillDemoUser() {
    this.switchTab('login');
    document.getElementById('login-email').value = 'demo@example.com';
    document.getElementById('login-password').value = 'password123';
    showToast('Demo credentials filled! Click "Sign In"', 'info');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AuthPage.init();
});

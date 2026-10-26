const assert = require('node:assert');
const app = require('../src/server');

const PORT = 3555;
let server;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function testFrontend() {
  console.log('🌐 Starting Frontend & Static Assets Test...\n');
  server = app.listen(PORT);

  try {
    const pages = [
      '/',
      '/index.html',
      '/product.html?id=1',
      '/cart.html',
      '/checkout.html',
      '/auth.html',
      '/orders.html',
      '/css/styles.css',
      '/js/api.js',
      '/js/auth.js',
      '/js/cart.js',
      '/js/catalog.js',
      '/js/product-detail.js',
      '/js/cart-page.js',
      '/js/checkout.js',
      '/js/orders.js',
      '/js/auth-page.js'
    ];

    for (const page of pages) {
      const res = await fetch(`${BASE_URL}${page}`);
      assert.strictEqual(res.status, 200, `Failed to load ${page}`);
      const text = await res.text();
      assert.ok(text.length > 50, `${page} returned empty content`);
      console.log(`  ✓ Successfully fetched ${page} (${text.length} bytes)`);
    }

    console.log('\n🎉 ALL 17 FRONTEND ASSETS AND PAGES ARE ACCESSIBLE & VALID! 🎉\n');
  } catch (err) {
    console.error('❌ Frontend test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

testFrontend();

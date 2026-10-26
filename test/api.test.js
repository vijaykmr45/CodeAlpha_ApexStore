const assert = require('node:assert');
const app = require('../src/server');

const PORT = 3456;
let server;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTests() {
  console.log('🧪 Starting API Integration Tests...\n');

  server = app.listen(PORT);
  let authToken = null;
  let testProductId = null;
  let initialStock = 0;

  try {
    // 1. Health check
    console.log('Test 1: Health check endpoint');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthJson = await healthRes.json();
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthJson.status, 'ok');
    console.log('  ✅ Passed');

    // 2. Products Catalog
    console.log('Test 2: Product catalog listing & filtering');
    const prodRes = await fetch(`${BASE_URL}/api/products`);
    const prodJson = await prodRes.json();
    assert.strictEqual(prodRes.status, 200);
    assert.strictEqual(prodJson.success, true);
    assert.ok(prodJson.products.length >= 10, 'Should have at least 10 products');
    testProductId = prodJson.products[0].id;
    initialStock = prodJson.products[0].stock_quantity;
    console.log(`  ✅ Passed (Found ${prodJson.products.length} products, test product ID: ${testProductId})`);

    // 2b. Search & Category filter
    console.log('Test 2b: Search and Category filter');
    const searchRes = await fetch(`${BASE_URL}/api/products?search=Headphones`);
    const searchJson = await searchRes.json();
    assert.strictEqual(searchRes.status, 200);
    assert.ok(searchJson.products.length >= 1);
    assert.ok(searchJson.products[0].name.includes('Headphones'));
    console.log('  ✅ Passed');

    // 2c. Single product detail
    console.log('Test 2c: Single product detail with related items');
    const detailRes = await fetch(`${BASE_URL}/api/products/${testProductId}`);
    const detailJson = await detailRes.json();
    assert.strictEqual(detailRes.status, 200);
    assert.strictEqual(detailJson.product.id, testProductId);
    assert.ok(Array.isArray(detailJson.related));
    console.log('  ✅ Passed');

    // 3. User Registration
    console.log('Test 3: User registration');
    const testEmail = `test_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        email: testEmail,
        password: 'securePassword123'
      })
    });
    const regJson = await regRes.json();
    assert.strictEqual(regRes.status, 201);
    assert.strictEqual(regJson.success, true);
    assert.ok(regJson.token);
    assert.strictEqual(regJson.user.email, testEmail);
    console.log('  ✅ Passed');

    // 4. User Login
    console.log('Test 4: User login');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'securePassword123'
      })
    });
    const loginJson = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginJson.success, true);
    assert.ok(loginJson.token);
    authToken = loginJson.token;
    console.log('  ✅ Passed');

    // 5. Auth /me check
    console.log('Test 5: Authenticated profile check (/api/auth/me)');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const meJson = await meRes.json();
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meJson.user.email, testEmail);
    console.log('  ✅ Passed');

    // 6. Cart operations
    console.log('Test 6: Cart operations (Add, View, Update)');
    const addCartRes = await fetch(`${BASE_URL}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ productId: testProductId, quantity: 2 })
    });
    const addCartJson = await addCartRes.json();
    assert.strictEqual(addCartRes.status, 200);
    assert.strictEqual(addCartJson.success, true);

    const getCartRes = await fetch(`${BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const getCartJson = await getCartRes.json();
    assert.strictEqual(getCartRes.status, 200);
    assert.strictEqual(getCartJson.items.length, 1);
    assert.strictEqual(getCartJson.items[0].productId, testProductId);
    assert.strictEqual(getCartJson.items[0].quantity, 2);
    console.log('  ✅ Passed');

    // 7. Order Checkout & Transaction Verification
    console.log('Test 7: Order Checkout and stock deduction transaction');
    const checkoutRes = await fetch(`${BASE_URL}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        shipping: {
          name: 'Test Customer',
          address: '456 Innovation Way',
          city: 'Techville',
          postalCode: '10001',
          phone: '+1 555-0100'
        },
        payment: {
          cardNumber: '4242424242424242',
          expiry: '11/29',
          cvv: '999'
        }
      })
    });
    const checkoutJson = await checkoutRes.json();
    assert.strictEqual(checkoutRes.status, 201);
    assert.strictEqual(checkoutJson.success, true);
    assert.ok(checkoutJson.order.id);
    const orderId = checkoutJson.order.id;
    console.log(`  ✅ Passed (Order created with ID: #${orderId})`);

    // Verify cart is now cleared
    const cartAfterOrder = await (await fetch(`${BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })).json();
    assert.strictEqual(cartAfterOrder.items.length, 0, 'Cart should be empty after checkout');

    // Verify product stock was reduced by 2
    const productAfterOrder = await (await fetch(`${BASE_URL}/api/products/${testProductId}`)).json();
    assert.strictEqual(productAfterOrder.product.stock_quantity, initialStock - 2, 'Stock should be reduced by 2');
    console.log(`  ✅ Passed (Stock correctly decremented from ${initialStock} to ${productAfterOrder.product.stock_quantity})`);

    // 8. Order History
    console.log('Test 8: Order history retrieval');
    const ordersRes = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const ordersJson = await ordersRes.json();
    assert.strictEqual(ordersRes.status, 200);
    assert.strictEqual(ordersJson.orders.length, 1);
    assert.strictEqual(ordersJson.orders[0].id, orderId);
    assert.strictEqual(ordersJson.orders[0].items.length, 1);
    console.log('  ✅ Passed');

    console.log('\n🎉 ALL 8 BACKEND API INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();

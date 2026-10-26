const db = require('../config/database');

function checkout(req, res, next) {
  const userId = req.user.id;
  const { shipping, payment, items: providedItems } = req.body;

  if (!shipping || !shipping.name || !shipping.address || !shipping.city || !shipping.postalCode || !shipping.phone) {
    return res.status(400).json({
      success: false,
      error: 'Please fill in all shipping address fields'
    });
  }

  if (!payment || !payment.cardNumber || !payment.expiry || !payment.cvv) {
    return res.status(400).json({
      success: false,
      error: 'Payment details are required'
    });
  }

  // Determine items to purchase
  let orderItems = [];

  if (Array.isArray(providedItems) && providedItems.length > 0) {
    orderItems = providedItems;
  } else {
    // Read from user's database cart
    const cartRows = db.prepare(`
      SELECT product_id as productId, quantity
      FROM cart_items
      WHERE user_id = ?
    `).all(userId);

    orderItems = cartRows;
  }

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Your cart is empty. Please add items before checking out.'
    });
  }

  // Begin atomic SQLite transaction
  db.exec('BEGIN TRANSACTION');

  try {
    let subtotal = 0;
    const validatedItems = [];

    // Verify stock and fetch fresh product details
    for (const item of orderItems) {
      const pid = parseInt(item.productId, 10);
      const qty = parseInt(item.quantity, 10);

      if (isNaN(pid) || isNaN(qty) || qty <= 0) {
        throw new Error('Invalid product quantity encountered in order');
      }

      const product = db.prepare('SELECT id, name, price, stock_quantity FROM products WHERE id = ?').get(pid);

      if (!product) {
        throw new Error(`Product #${pid} was not found`);
      }

      if (product.stock_quantity < qty) {
        const error = new Error(`Insufficient stock for "${product.name}". Only ${product.stock_quantity} left.`);
        error.status = 409;
        throw error;
      }

      const lineTotal = parseFloat((product.price * qty).toFixed(2));
      subtotal += lineTotal;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: qty,
        subtotal: lineTotal
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const shippingCost = subtotal >= 50 ? 0 : 9.99;
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const grandTotal = parseFloat((subtotal + shippingCost + tax).toFixed(2));

    // Deduct stock for each item
    const updateStockStmt = db.prepare(`
      UPDATE products
      SET stock_quantity = stock_quantity - ?
      WHERE id = ?
    `);

    for (const item of validatedItems) {
      updateStockStmt.run(item.quantity, item.productId);
    }

    // Insert order record
    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (
        user_id,
        total_amount,
        shipping_name,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_phone,
        payment_method,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Processing')
    `);

    const orderResult = insertOrderStmt.run(
      userId,
      grandTotal,
      shipping.name.trim(),
      shipping.address.trim(),
      shipping.city.trim(),
      shipping.postalCode.trim(),
      shipping.phone.trim(),
      `Card ending in ${payment.cardNumber.replace(/\s+/g, '').slice(-4) || '4242'}`
    );

    const orderId = Number(orderResult.lastInsertRowid);

    // Insert order items
    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (
        order_id,
        product_id,
        product_name,
        unit_price,
        quantity,
        subtotal
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of validatedItems) {
      insertItemStmt.run(
        orderId,
        item.productId,
        item.name,
        item.unitPrice,
        item.quantity,
        item.subtotal
      );
    }

    // Clear cart in database
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);

    // Commit transaction
    db.exec('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        id: orderId,
        totalAmount: grandTotal,
        subtotal,
        shippingCost,
        tax,
        status: 'Processing',
        createdAt: new Date().toISOString(),
        shipping: {
          name: shipping.name,
          address: shipping.address,
          city: shipping.city,
          postalCode: shipping.postalCode,
          phone: shipping.phone
        },
        items: validatedItems
      }
    });
  } catch (err) {
    db.exec('ROLLBACK');
    next(err);
  }
}

function getOrders(req, res, next) {
  try {
    const userId = req.user.id;

    const ordersStmt = db.prepare(`
      SELECT 
        id,
        total_amount,
        shipping_name,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        payment_method,
        status,
        created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY id DESC
    `);
    const orders = ordersStmt.all(userId);

    const itemsStmt = db.prepare(`
      SELECT 
        order_id,
        product_id,
        product_name,
        unit_price,
        quantity,
        subtotal
      FROM order_items
      WHERE order_id = ?
    `);

    for (const order of orders) {
      order.items = itemsStmt.all(order.id);
      order.total_items = order.items.reduce((sum, it) => sum + it.quantity, 0);
    }

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    next(err);
  }
}

function getOrderById(req, res, next) {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id, 10);

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    const orderStmt = db.prepare(`
      SELECT 
        id,
        user_id,
        total_amount,
        shipping_name,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_phone,
        payment_method,
        status,
        created_at
      FROM orders
      WHERE id = ? AND user_id = ?
    `);
    const order = orderStmt.get(orderId, userId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const itemsStmt = db.prepare(`
      SELECT 
        id,
        product_id,
        product_name,
        unit_price,
        quantity,
        subtotal
      FROM order_items
      WHERE order_id = ?
    `);
    order.items = itemsStmt.all(orderId);

    res.json({
      success: true,
      order
    });
  } catch (err) {
    next(err);
  }
}

function getAllOrders(req, res, next) {
  try {
    const ordersStmt = db.prepare(`
      SELECT 
        o.id,
        o.user_id,
        u.name as user_name,
        u.email as user_email,
        o.total_amount,
        o.shipping_name,
        o.shipping_address,
        o.shipping_city,
        o.payment_method,
        o.status,
        o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.id DESC
    `);
    const orders = ordersStmt.all();

    const itemsStmt = db.prepare(`
      SELECT order_id, product_name, unit_price, quantity, subtotal
      FROM order_items
      WHERE order_id = ?
    `);

    for (const order of orders) {
      order.items = itemsStmt.all(order.id);
    }

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    next(err);
  }
}

function updateOrderStatus(req, res, next) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  checkout,
  getOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};

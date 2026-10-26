const db = require('../config/database');

function calculateCartTotals(items) {
  let subtotal = 0;
  let totalCount = 0;

  for (const item of items) {
    item.lineTotal = parseFloat((item.price * item.quantity).toFixed(2));
    subtotal += item.lineTotal;
    totalCount += item.quantity;
  }

  subtotal = parseFloat(subtotal.toFixed(2));
  // Free shipping on orders over $50, otherwise $9.99
  const shipping = subtotal === 0 ? 0 : (subtotal >= 50 ? 0 : 9.99);
  // Estimated 8% sales tax
  const tax = parseFloat((subtotal * 0.08).toFixed(2));
  const total = parseFloat((subtotal + shipping + tax).toFixed(2));

  return { subtotal, shipping, tax, total, totalCount };
}

function getCart(req, res, next) {
  try {
    const userId = req.user.id;

    const stmt = db.prepare(`
      SELECT 
        c.id as cart_item_id,
        c.product_id as productId,
        c.quantity,
        p.name,
        p.price,
        p.image_url,
        p.category,
        p.stock_quantity
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.id DESC
    `);
    const items = stmt.all(userId);

    const totals = calculateCartTotals(items);

    res.json({
      success: true,
      items,
      ...totals
    });
  } catch (err) {
    next(err);
  }
}

function addToCart(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    const parsedPid = parseInt(productId, 10);
    const parsedQty = parseInt(quantity, 10);

    if (isNaN(parsedPid) || isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid product ID and positive quantity are required'
      });
    }

    const product = db.prepare('SELECT id, name, stock_quantity FROM products WHERE id = ?').get(parsedPid);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    if (product.stock_quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Sorry, this product is currently out of stock'
      });
    }

    // Check if already in cart
    const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, parsedPid);

    if (existing) {
      const newQuantity = existing.quantity + parsedQty;
      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({
          success: false,
          error: `Only ${product.stock_quantity} items are available in stock`
        });
      }

      db.prepare(`
        UPDATE cart_items
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newQuantity, existing.id);
    } else {
      if (parsedQty > product.stock_quantity) {
        return res.status(400).json({
          success: false,
          error: `Only ${product.stock_quantity} items are available in stock`
        });
      }

      db.prepare(`
        INSERT INTO cart_items (user_id, product_id, quantity)
        VALUES (?, ?, ?)
      `).run(userId, parsedPid, parsedQty);
    }

    const totalCountStmt = db.prepare('SELECT SUM(quantity) as count FROM cart_items WHERE user_id = ?');
    const { count } = totalCountStmt.get(userId);

    res.json({
      success: true,
      message: `${product.name} added to cart`,
      cartCount: count || 0
    });
  } catch (err) {
    next(err);
  }
}

function updateCart(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const parsedPid = parseInt(productId, 10);
    const parsedQty = parseInt(quantity, 10);

    if (isNaN(parsedPid) || isNaN(parsedQty)) {
      return res.status(400).json({
        success: false,
        error: 'Valid product ID and numeric quantity are required'
      });
    }

    if (parsedQty <= 0) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(userId, parsedPid);
      return res.json({
        success: true,
        message: 'Item removed from cart'
      });
    }

    const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(parsedPid);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    if (parsedQty > product.stock_quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stock_quantity} items are available in stock`
      });
    }

    const result = db.prepare(`
      UPDATE cart_items
      SET quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND product_id = ?
    `).run(parsedQty, userId, parsedPid);

    if (result.changes === 0) {
      // If not yet in cart, insert it
      db.prepare(`
        INSERT INTO cart_items (user_id, product_id, quantity)
        VALUES (?, ?, ?)
      `).run(userId, parsedPid, parsedQty);
    }

    res.json({
      success: true,
      message: 'Cart updated successfully'
    });
  } catch (err) {
    next(err);
  }
}

function removeFromCart(req, res, next) {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.productId, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(userId, productId);

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (err) {
    next(err);
  }
}

function clearCart(req, res, next) {
  try {
    const userId = req.user.id;
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (err) {
    next(err);
  }
}

function syncCart(req, res, next) {
  try {
    const userId = req.user.id;
    const { localItems } = req.body;

    if (Array.isArray(localItems) && localItems.length > 0) {
      for (const item of localItems) {
        const pid = parseInt(item.productId, 10);
        const qty = parseInt(item.quantity, 10);
        if (isNaN(pid) || isNaN(qty) || qty <= 0) continue;

        const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(pid);
        if (!product) continue;

        const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, pid);
        if (existing) {
          const combined = Math.min(existing.quantity + qty, product.stock_quantity);
          db.prepare('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(combined, existing.id);
        } else {
          const finalQty = Math.min(qty, product.stock_quantity);
          if (finalQty > 0) {
            db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(userId, pid, finalQty);
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Cart synchronized'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
  syncCart
};

const db = require('../config/database');

function getProducts(req, res, next) {
  try {
    const { search, category, sort, min_price, max_price } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (category && category !== 'All' && category.trim()) {
      query += ' AND category = ?';
      params.push(category.trim());
    }

    if (min_price && !isNaN(Number(min_price))) {
      query += ' AND price >= ?';
      params.push(Number(min_price));
    }

    if (max_price && !isNaN(Number(max_price))) {
      query += ' AND price <= ?';
      params.push(Number(max_price));
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query += ' ORDER BY price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY price DESC';
        break;
      case 'rating_desc':
        query += ' ORDER BY rating DESC';
        break;
      case 'name_asc':
        query += ' ORDER BY name ASC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY id DESC';
        break;
    }

    const stmt = db.prepare(query);
    const products = stmt.all(...params);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    next(err);
  }
}

function getCategories(req, res, next) {
  try {
    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM products');
    const { total } = totalStmt.get();

    const stmt = db.prepare(`
      SELECT category as name, COUNT(*) as count
      FROM products
      GROUP BY category
      ORDER BY category ASC
    `);
    const categoryRows = stmt.all();

    const categories = [
      { name: 'All', count: total },
      ...categoryRows
    ];

    res.json({
      success: true,
      categories
    });
  } catch (err) {
    next(err);
  }
}

function getProductById(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
    }

    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const product = stmt.get(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Related products in the same category
    const relatedStmt = db.prepare(`
      SELECT id, name, price, category, image_url, rating, stock_quantity
      FROM products
      WHERE category = ? AND id != ?
      LIMIT 4
    `);
    const related = relatedStmt.all(product.category, productId);

    res.json({
      success: true,
      product,
      related
    });
  } catch (err) {
    next(err);
  }
}

function createProduct(req, res, next) {
  try {
    const { name, description, price, category, image_url, stock_quantity, rating } = req.body;

    if (!name || !description || price === undefined || !category) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, price, and category are required'
      });
    }

    const numPrice = parseFloat(price);
    const numStock = stock_quantity !== undefined ? parseInt(stock_quantity, 10) : 10;
    const numRating = rating !== undefined ? parseFloat(rating) : 4.5;

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, error: 'Price must be a positive number' });
    }
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ success: false, error: 'Stock must be a non-negative number' });
    }

    // Default placeholder image if none provided
    const finalImage = image_url && image_url.trim() 
      ? image_url.trim() 
      : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';

    const insertStmt = db.prepare(`
      INSERT INTO products (name, description, price, category, image_url, stock_quantity, rating)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      name.trim(),
      description.trim(),
      numPrice,
      category.trim(),
      finalImage,
      numStock,
      numRating
    );

    const newId = Number(result.lastInsertRowid);
    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(newId);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (err) {
    next(err);
  }
}

function updateProduct(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const { name, description, price, category, image_url, stock_quantity, rating } = req.body;

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedDesc = description !== undefined ? description.trim() : existing.description;
    const updatedPrice = price !== undefined ? parseFloat(price) : existing.price;
    const updatedCat = category !== undefined ? category.trim() : existing.category;
    const updatedImg = image_url !== undefined ? image_url.trim() : existing.image_url;
    const updatedStock = stock_quantity !== undefined ? parseInt(stock_quantity, 10) : existing.stock_quantity;
    const updatedRating = rating !== undefined ? parseFloat(rating) : existing.rating;

    db.prepare(`
      UPDATE products
      SET name = ?, description = ?, price = ?, category = ?, image_url = ?, stock_quantity = ?, rating = ?
      WHERE id = ?
    `).run(
      updatedName,
      updatedDesc,
      updatedPrice,
      updatedCat,
      updatedImg,
      updatedStock,
      updatedRating,
      productId
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updated
    });
  } catch (err) {
    next(err);
  }
}

function deleteProduct(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    // Check if in active order items
    const inOrder = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?').get(productId);
    if (inOrder.count > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete product because it is referenced in ${inOrder.count} completed order(s). You can set its stock to 0 instead.`
      });
    }

    const result = db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

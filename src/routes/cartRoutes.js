const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/update', cartController.updateCart);
router.delete('/item/:productId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);
router.post('/sync', cartController.syncCart);

module.exports = router;

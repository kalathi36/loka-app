const express = require('express');
const {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/').get(getProducts).post(authorizeRoles('admin'), createProduct);
router
  .route('/:id')
  .put(authorizeRoles('admin'), updateProduct)
  .delete(authorizeRoles('admin'), deleteProduct);

module.exports = router;

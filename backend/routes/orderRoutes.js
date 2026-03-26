const express = require('express');
const {
  assignWorker,
  createOrder,
  getOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { uploadSingleDeliveryProof } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.route('/').post(authorizeRoles('customer'), createOrder).get(getOrders);
router
  .route('/:id/status')
  .put(authorizeRoles('admin', 'worker'), uploadSingleDeliveryProof, updateOrderStatus);
router.route('/:id/assign').put(authorizeRoles('admin'), assignWorker);

module.exports = router;

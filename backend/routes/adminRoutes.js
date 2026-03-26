const express = require('express');
const {
  getAnalytics,
  getDashboard,
  getWorkerLocations,
  getCustomers,
  getWorkerPayments,
  createWorkerPayment,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('admin'));

router.get('/analytics', getAnalytics);
router.get('/dashboard', getDashboard);
router.get('/worker-locations', getWorkerLocations);
router.get('/customers', getCustomers);
router.get('/payments', getWorkerPayments);
router.post('/payments', createWorkerPayment);

module.exports = router;

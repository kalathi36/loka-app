const express = require('express');
const { getAnalytics, getWorkerLocations } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('admin'));

router.get('/analytics', getAnalytics);
router.get('/worker-locations', getWorkerLocations);

module.exports = router;

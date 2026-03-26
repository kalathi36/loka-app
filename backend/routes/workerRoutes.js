const express = require('express');
const { getWorkers, postGps, getWorkerEarnings } = require('../controllers/workerController');
const { checkIn } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', authorizeRoles('admin'), getWorkers);
router.post('/attendance', authorizeRoles('worker'), checkIn);
router.post('/gps', authorizeRoles('worker'), postGps);
router.get('/earnings', authorizeRoles('worker'), getWorkerEarnings);

module.exports = router;

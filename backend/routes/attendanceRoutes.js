const express = require('express');
const {
  checkIn,
  checkOut,
  getWorkerAttendance,
  getAttendanceRecords,
  updateAttendanceRecord,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/checkin', authorizeRoles('worker'), checkIn);
router.post('/checkout', authorizeRoles('worker'), checkOut);
router.get('/worker/:id', authorizeRoles('admin', 'worker'), getWorkerAttendance);
router.get('/', authorizeRoles('admin'), getAttendanceRecords);
router.put('/:id', authorizeRoles('admin'), updateAttendanceRecord);

module.exports = router;

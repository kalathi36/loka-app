const express = require('express');
const { getWorkers, postAttendance, postGps } = require('../controllers/workerController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', authorizeRoles('admin'), getWorkers);
router.post('/attendance', authorizeRoles('worker'), postAttendance);
router.post('/gps', authorizeRoles('worker'), postGps);

module.exports = router;

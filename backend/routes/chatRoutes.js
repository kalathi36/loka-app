const express = require('express');
const {
  getContacts,
  getMessages,
  getThreads,
  postMessage,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('admin', 'customer'));

router.get('/contacts', getContacts);
router.get('/threads', getThreads);
router.route('/:partnerId').get(getMessages).post(postMessage);

module.exports = router;

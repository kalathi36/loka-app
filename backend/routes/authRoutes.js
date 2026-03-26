const express = require('express');
const {
  forgotPassword,
  getProfile,
  login,
  register,
  registerOrganization,
  registerUser,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/signup', registerUser);
router.post('/register-organization', registerOrganization);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;

const express = require('express');
const {
  login,
  register,
  registerOrganization,
  registerUser,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/signup', registerUser);
router.post('/register-organization', registerOrganization);
router.post('/login', login);

module.exports = router;

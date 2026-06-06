const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const validate = require('../middleware/validation');
const router = express.Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.get('/me', authMiddleware, getMe);

module.exports = router;
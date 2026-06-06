const express = require('express');
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');
const { param } = require('express-validator');
const validate = require('../middleware/validation');
const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.post('/:id/read', authMiddleware, param('id').isMongoId(), validate, markAsRead);

module.exports = router;
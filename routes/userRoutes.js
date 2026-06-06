const express = require('express');
const { saveArticle, unsaveArticle, getSavedArticles, getPreferences, updatePreferences, updateUsername } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validation');
const router = express.Router();

router.post('/news/:id/save', authMiddleware, param('id').isMongoId(), validate, saveArticle);
router.delete('/news/:id/save', authMiddleware, param('id').isMongoId(), validate, unsaveArticle);
router.get('/saved', authMiddleware, getSavedArticles);
router.get('/preferences', authMiddleware, getPreferences);
router.put('/preferences', authMiddleware, updatePreferences);
router.put('/username', authMiddleware, body('username').isLength({ min: 3, max: 30 }).trim().escape(), validate, updateUsername);

module.exports = router;
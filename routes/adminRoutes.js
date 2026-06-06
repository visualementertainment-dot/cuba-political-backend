const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { body, param } = require('express-validator');
const validate = require('../middleware/validation');
const router = express.Router();

// Todas las rutas requieren auth y admin
router.use(authMiddleware, adminMiddleware);

router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', param('id').isMongoId(), validate, adminController.updateUserRole);
router.delete('/users/:id', param('id').isMongoId(), validate, adminController.deleteUser);

router.get('/comments', adminController.getAllComments);
router.put('/comments/:id', param('id').isMongoId(), body('text').notEmpty(), validate, adminController.updateComment);
router.delete('/comments/:id', param('id').isMongoId(), validate, adminController.deleteCommentAdmin);

router.post('/news', body('title').notEmpty(), body('source').notEmpty(), validate, adminController.createArticle);
router.put('/news/:id', param('id').isMongoId(), validate, adminController.updateArticle);
router.delete('/news/:id', param('id').isMongoId(), validate, adminController.deleteArticle);

router.get('/sources', adminController.getSourcesAdmin);
router.post('/sources', body('id').notEmpty(), body('name').notEmpty(), validate, adminController.createSource);
router.put('/sources/:id', adminController.updateSource);
router.delete('/sources/:id', adminController.deleteSource);

module.exports = router;
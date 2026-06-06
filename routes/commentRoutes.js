const express = require('express');
const { getComments, addComment, editComment, deleteComment } = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');
const { addCommentValidator, updateCommentValidator, deleteCommentValidator } = require('../validators/commentValidator');
const validate = require('../middleware/validation');
const router = express.Router();

router.get('/:articleId', getComments);
router.post('/:articleId', authMiddleware, addCommentValidator, validate, addComment);
router.put('/:commentId', authMiddleware, updateCommentValidator, validate, editComment);
router.delete('/:commentId', authMiddleware, deleteCommentValidator, validate, deleteComment);

module.exports = router;
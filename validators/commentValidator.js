const { body, param } = require('express-validator');

const addCommentValidator = [
  param('articleId').isMongoId(),
  body('text').isLength({ min: 1, max: 2000 }).trim().escape(),
];

const updateCommentValidator = [
  param('commentId').isMongoId(),
  body('text').isLength({ min: 1, max: 2000 }).trim().escape(),
];

const deleteCommentValidator = [
  param('commentId').isMongoId(),
];

module.exports = { addCommentValidator, updateCommentValidator, deleteCommentValidator };
const express = require('express');
const { getNews, getArticleById, incrementReads } = require('../controllers/newsController');
const { param } = require('express-validator');
const validate = require('../middleware/validation');
const router = express.Router();

router.get('/', getNews);
router.get('/:id', param('id').isMongoId(), validate, getArticleById);
router.post('/:id/read', param('id').isMongoId(), validate, incrementReads);

module.exports = router;
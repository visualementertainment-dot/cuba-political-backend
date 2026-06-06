const Source = require('../models/Source');
const asyncHandler = require('../utils/asyncHandler');

exports.getSources = asyncHandler(async (req, res) => {
  const sources = await Source.find();
  res.json(sources);
});
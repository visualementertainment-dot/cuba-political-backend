const User = require('../models/User');
const Comment = require('../models/Comment');
const Source = require('../models/Source');
const asyncHandler = require('../utils/asyncHandler');

exports.saveArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.userId);
  if (!user.savedArticles.some(articleId => articleId.toString() === id)) {
    user.savedArticles.push(id);
    await user.save();
  }
  res.json({ saved: user.savedArticles });
});

exports.unsaveArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.userId);
  user.savedArticles = user.savedArticles.filter(artId => artId.toString() !== id);
  await user.save();
  res.json({ saved: user.savedArticles });
});

exports.getSavedArticles = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).populate('savedArticles');
  res.json(user.savedArticles);
});

exports.getPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select('preferences');
  res.json(user.preferences);
});

exports.updatePreferences = asyncHandler(async (req, res) => {
  const { selectedSources, notifyUrgent, notifyComments } = req.body;
  const user = await User.findById(req.userId);

  // Validar que los sources existan
  if (selectedSources !== undefined && Array.isArray(selectedSources)) {
    const validSources = await Source.find().distinct('id');
    const invalid = selectedSources.filter(s => !validSources.includes(s));
    if (invalid.length) {
      return res.status(400).json({ error: `Fuentes inválidas: ${invalid.join(', ')}` });
    }
    user.preferences.selectedSources = selectedSources;
  }

  if (typeof notifyUrgent === 'boolean') user.preferences.notifyUrgent = notifyUrgent;
  if (typeof notifyComments === 'boolean') user.preferences.notifyComments = notifyComments;

  await user.save();
  res.json(user.preferences);
});

exports.updateUsername = asyncHandler(async (req, res) => {
  const { username } = req.body;
  const user = await User.findById(req.userId);
  if (!username || username.trim().length < 3 || username.trim().length > 30) {
    return res.status(400).json({ error: 'Nombre de usuario inválido' });
  }
  user.username = username.trim();
  await user.save();
  await Comment.updateMany({ userId: user._id }, { username });
  res.json({ username });
});
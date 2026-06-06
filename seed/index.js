const Source = require('../models/Source');
const Article = require('../models/Article');
const SOURCES = require('./sources');
const MOCK_NEWS = require('./mockNews');

async function seedDatabase() {
  const sourceCount = await Source.countDocuments();
  if (sourceCount === 0) {
    await Source.insertMany(SOURCES);
    console.log('✅ Fuentes sembradas');
  }
  const articleCount = await Article.countDocuments();
  if (articleCount === 0) {
    const articlesWithDates = MOCK_NEWS.map(article => ({
      ...article,
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    }));
    await Article.insertMany(articlesWithDates);
    console.log('✅ Artículos sembrados');
  }
}

module.exports = seedDatabase;
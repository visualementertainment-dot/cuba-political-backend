require('dotenv').config();
const mongoose = require('mongoose');
const Source = require('../models/Source');
const { MONGODB_URI } = require('../config/env');

// TODAS LAS FUENTES RSS (OFICIALES + INDEPENDIENTES)
const rssSources = [
  // ============ OFICIALES ============
  { id: "granma", name: "Granma", icon: "📰", color: "#d32f2f", category: "Oficial", rssUrl: "http://www.granma.cu/feed/", refreshInterval: 10 },
  { id: "cubadebate", name: "Cubadebate", icon: "💬", color: "#f57c00", category: "Oficial", rssUrl: "http://www.cubadebate.cu/feed/", refreshInterval: 5 },
  { id: "acn", name: "ACN", icon: "📢", color: "#7b1fa2", category: "Oficial", rssUrl: "http://www.acn.cu/feed", refreshInterval: 15 },
  { id: "juventud-rebelde", name: "Juventud Rebelde", icon: "🗞️", color: "#1976d2", category: "Oficial", rssUrl: "http://www.juventudrebelde.cu/rss.xml", refreshInterval: 10 },
  
  // ============ INDEPENDIENTES ============
  { id: "cubanet", name: "Cubanet", icon: "🌐", color: "#1a1a1a", category: "Independiente", rssUrl: "https://www.cubanet.org/feed/", refreshInterval: 5 },
  { id: "14ymedio", name: "14ymedio", icon: "14", color: "#1a1a1a", category: "Independiente", rssUrl: "https://14ymedio.com/rss", refreshInterval: 5 },
  { id: "adncuba", name: "ADN Cuba", icon: "AD", color: "#1a1a1a", category: "Independiente", rssUrl: "https://adncuba.com/feed", refreshInterval: 10 },
  { id: "cibercuba", name: "CiberCuba", icon: "🌎", color: "#1a1a1a", category: "Independiente", rssUrl: "https://www.cibercuba.com/feed", refreshInterval: 10 }
];

async function addRSSSources() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📡 Conectado a MongoDB');

    for (const source of rssSources) {
      const updated = await Source.findOneAndUpdate(
        { id: source.id },
        { 
          $set: { 
            name: source.name,
            icon: source.icon,
            color: source.color,
            category: source.category,
            rssUrl: source.rssUrl, 
            refreshInterval: source.refreshInterval,
            active: true
          } 
        },
        { upsert: true, new: true }
      );
      console.log(`✅ ${updated.name} (${updated.category}) - RSS: ${source.rssUrl}`);
    }
    
    console.log('\n🎉 Todas las fuentes RSS han sido configuradas');
    console.log(`📊 Total: ${rssSources.length} fuentes (${rssSources.filter(s => s.category === 'Oficial').length} oficiales + ${rssSources.filter(s => s.category === 'Independiente').length} independientes)`);
    console.log('💡 Reinicia el servidor para comenzar a recibir noticias');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

addRSSSources();
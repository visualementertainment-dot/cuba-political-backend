const MOCK_NEWS = [
  { source: "cubanet", urgent: true, category: "Nacional", title: "Crisis en Cuba...", summary: "...", author: "Redacción Cubanet", reads: 15200, body: "..." },
  // ... (todos los artículos mock, pero sin campo 'id' ni 'time')
];

// Añadimos publishedAt automático al insertar
module.exports = MOCK_NEWS;
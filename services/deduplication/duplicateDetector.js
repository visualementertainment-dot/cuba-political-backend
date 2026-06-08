const News = require('../../models/News');
const { createContentHash } = require('../../utils/hashUtils');
const logger = require('../../utils/logger');

class DuplicateDetector {
  /**
   * Detecta y filtra artículos duplicados
   * @param {Array} articles - Array de artículos a verificar
   * @returns {Promise<Object>} { newArticles, duplicateCount, duplicates }
   */
  async filterDuplicates(articles) {
    try {
      const newArticles = [];
      const duplicates = [];

      for (const article of articles) {
        const isDuplicate = await this.isDuplicate(article);

        if (isDuplicate) {
          duplicates.push({
            title: article.title,
            contentHash: article.contentHash,
            reason: 'Hash coincide con artículo existente'
          });
        } else {
          newArticles.push(article);
        }
      }

      logger.info(`🔍 Deduplicación: ${newArticles.length} nuevos, ${duplicates.length} duplicados`);

      return {
        newArticles,
        duplicateCount: duplicates.length,
        duplicates
      };
    } catch (err) {
      logger.error(`❌ Error en deduplicación: ${err.message}`);
      throw err;
    }
  }

  /**
   * Verifica si un artículo es duplicado
   * @param {Object} article - Artículo a verificar
   * @returns {Promise<boolean>} true si es duplicado
   */
  async isDuplicate(article) {
    try {
      // 1. Buscar por hash exacto
      const byHash = await News.findOne({ contentHash: article.contentHash });
      if (byHash) {
        return true;
      }

      // 2. Buscar por URL externa
      if (article.externalId) {
        const byExternalId = await News.findOne({ externalId: article.externalId });
        if (byExternalId) {
          return true;
        }
      }

      // 3. Búsqueda de similitud (título muy similar + misma fuente + fecha cercana)
      const similarity = await this.findSimilarArticles(article);
      if (similarity.length > 0) {
        logger.warn(`⚠️ Artículo similar encontrado: "${article.title}"`);
        return true;
      }

      return false;
    } catch (err) {
      logger.error(`Error verificando duplicado: ${err.message}`);
      return false; // Si hay error, permitir el artículo
    }
  }

  /**
   * Encuentra artículos similares usando algoritmo simple
   * @param {Object} article - Artículo a comparar
   * @returns {Promise<Array>} Artículos similares
   */
  async findSimilarArticles(article) {
    try {
      // Obtener artículos recientes de la misma fuente
      const recentArticles = await News.find({
        sourceId: article.sourceId,
        publishedAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        },
        _id: { $ne: article._id }
      }).limit(50);

      // Calcular similitud del título
      const similarity = recentArticles.filter(other => {
        const score = this.calculateSimilarity(article.title, other.title);
        return score > 0.8; // Más del 80% de similitud
      });

      return similarity;
    } catch (err) {
      logger.error(`Error buscando artículos similares: ${err.message}`);
      return [];
    }
  }

  /**
   * Calcula puntuación de similitud entre dos strings
   * Usa algoritmo de Levenshtein simplificado
   * @param {string} str1 - Primer string
   * @param {string} str2 - Segundo string
   * @returns {number} Puntuación entre 0 y 1
   */
  calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Si son idénticos
    if (s1 === s2) return 1;

    // Si uno contiene al otro
    if (s1.includes(s2) || s2.includes(s1)) {
      return Math.max(s1.length, s2.length) / (Math.min(s1.length, s2.length) + 1);
    }

    // Levenshtein distance simplificado
    const maxLen = Math.max(s1.length, s2.length);
    const distance = this.levenshteinDistance(s1, s2);
    return 1 - (distance / maxLen);
  }

  /**
   * Calcula la distancia de Levenshtein entre dos strings
   * @param {string} str1
   * @param {string} str2
   * @returns {number} Distancia
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Marca artículos como duplicados de otro
   * @param {ObjectId} originalId - ID del artículo original
   * @param {Array<ObjectId>} duplicateIds - IDs de los duplicados
   */
  async markAsDuplicates(originalId, duplicateIds) {
    try {
      await News.updateMany(
        { _id: { $in: duplicateIds } },
        {
          isDuplicate: true,
          duplicateOf: originalId
        }
      );

      logger.info(`🔗 ${duplicateIds.length} artículos marcados como duplicados`);
    } catch (err) {
      logger.error(`Error marcando duplicados: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new DuplicateDetector();
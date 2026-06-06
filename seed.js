const mongoose = require("mongoose");
const Source = require("./models/Source");
const Article = require("./models/Article");

async function seedDatabase() {
  try {
    console.log("🌱 Verificando fuentes en la base de datos...");

    // ============ 1. SEMILLA DE FUENTES ============
    const sourceCount = await Source.countDocuments();
    
    if (sourceCount === 0) {
      console.log("📝 Insertando fuentes iniciales...");
      
      await Source.insertMany([
        { id: "granma", name: "Granma", icon: "📰", color: "#d32f2f", category: "Prensa" },
        { id: "juventud-rebelde", name: "Juventud Rebelde", icon: "🗞️", color: "#1976d2", category: "Prensa" },
        { id: "trabajadores", name: "Trabajadores", icon: "📄", color: "#388e3c", category: "Prensa" },
        { id: "cubadebate", name: "Cubadebate", icon: "💬", color: "#f57c00", category: "Digital" },
        { id: "acn", name: "Agencia Cubana de Noticias", icon: "📢", color: "#7b1fa2", category: "Agencia" },
        { id: "cubanet", name: "Cubanet", icon: "🌐", color: "#1a1a1a", category: "Independiente" },
        { id: "14ymedio", name: "14ymedio", icon: "14", color: "#1a1a1a", category: "Independiente" },
        { id: "adncuba", name: "ADN Cuba", icon: "AD", color: "#1a1a1a", category: "Independiente" },
        { id: "periodismodebarrio", name: "Periodismo de Barrio", icon: "🏘️", color: "#2e7d32", category: "Comunidad" },
      ]);
      console.log("✅ Fuentes insertadas correctamente");
    } else {
      console.log(`📊 Ya existen ${sourceCount} fuentes`);
    }

    // ============ 2. SEMILLA DE ARTÍCULOS ============
    const articleCount = await Article.countDocuments();
    
    if (articleCount === 0) {
      console.log("📝 Insertando artículos de ejemplo...");

      const articles = [
        // Granma
        {
          source: "granma",
          urgent: true,
          category: "Política",
          title: "Asamblea Nacional aprueba nuevas medidas económicas",
          summary: "El parlamento cubano aprobó un paquete de medidas para reactivar la economía nacional.",
          author: "Redacción Granma",
          body: "En sesión extraordinaria, la Asamblea Nacional del Poder Popular aprobó...\n\nLas nuevas medidas incluyen incentivos fiscales y apertura a nuevas formas de gestión.\n\nSe espera que estas decisiones impacten positivamente en la economía del país.",
          reads: 1250,
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          source: "granma",
          urgent: false,
          category: "Cultura",
          title: "La Habana se prepara para la Feria Internacional del Libro",
          summary: "La edición 32 del evento literario reunirá a escritores de más de 20 países.",
          author: "Redacción Cultural",
          body: "La Fortaleza de San Carlos de la Cabaña será la sede principal...\n\nParticiparán editoriales de toda Latinoamérica y Europa.\n\nEl evento se extenderá por dos semanas.",
          reads: 890,
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        // Cubadebate
        {
          source: "cubadebate",
          urgent: true,
          category: "Internacional",
          title: "Cuba reitera su apoyo a la integración latinoamericana",
          summary: "El canciller cubano participó en cumbre de la CELAC y abogó por la unidad regional.",
          author: "Redacción Internacional",
          body: "Durante su intervención, el canciller destacó los avances en cooperación...\n\nSe firmaron acuerdos de colaboración en salud y educación.\n\nLa próxima cumbre se realizará en Brasil.",
          reads: 2100,
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        // Cubanet
        {
          source: "cubanet",
          urgent: false,
          category: "Economía",
          title: "Emprendedores cubanos buscan nuevas oportunidades",
          summary: "A pesar de las dificultades, los pequeños negocios encuentran formas de crecer.",
          author: "Redacción Cubanet",
          body: "El sector privado en Cuba ha mostrado resiliencia...\n\nNuevas regulaciones facilitan la importación de insumos.\n\nMuchos emprendedores apuestan por la tecnología.",
          reads: 3400,
          publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        },
        // 14ymedio
        {
          source: "14ymedio",
          urgent: true,
          category: "Política",
          title: "Análisis: El futuro de las relaciones Cuba-EE.UU.",
          summary: "Expertos debaten sobre posibles escenarios tras los recientes anuncios.",
          author: "Equipo de Análisis",
          body: "Las relaciones bilaterales atraviesan un momento complejo...\n\nSe esperan movimientos diplomáticos en los próximos meses.\n\nLa comunidad internacional observa con atención.",
          reads: 5600,
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        // Periodismo de Barrio
        {
          source: "periodismodebarrio",
          urgent: false,
          category: "Sociedad",
          title: "Reportaje: La vida en un barrio habanero",
          summary: "Vecinos comparten sus experiencias y desafíos cotidianos.",
          author: "Periodismo de Barrio",
          body: "Caminando por las calles del Centro Habana...\n\nLos protagonistas cuentan cómo enfrentan la vida diaria.\n\nLa solidaridad entre vecinos es un pilar fundamental.",
          reads: 980,
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        // Juventud Rebelde
        {
          source: "juventud-rebelde",
          urgent: false,
          category: "Deportes",
          title: "Jóvenes atletas cubanos se preparan para competencias internacionales",
          summary: "La cantera del deporte cubano entrena con miras a próximos eventos.",
          author: "Redacción Deportes",
          body: "Los entrenamientos se intensifican en la Escuela Nacional...\n\nVarias promesas del atletismo muestran resultados alentadores.\n\nCuba aspira a mantener su tradición deportiva.",
          reads: 750,
          publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        },
        // Trabajadores
        {
          source: "trabajadores",
          urgent: false,
          category: "Economía",
          title: "Sindicatos debaten sobre condiciones laborales",
          summary: "Trabajadores de diversos sectores analizan mejoras en sus centros laborales.",
          author: "Redacción Sindical",
          body: "Las asambleas obreras han sido el espacio de debate...\n\nSe proponen nuevas medidas para la protección del trabajador.\n\nLa productividad es un tema central en las discusiones.",
          reads: 620,
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        // ACN
        {
          source: "acn",
          urgent: true,
          category: "Salud",
          title: "Cuba mantiene programas de cooperación médica internacional",
          summary: "Brigadas de salud cubanas continúan su labor en varios países del mundo.",
          author: "ACN",
          body: "Más de 30 mil profesionales de la salud cubanos prestan servicios...\n\nLa cooperación médica ha sido reconocida por la OMS.\n\nNuevos contingentes partirán en los próximos meses.",
          reads: 1430,
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        // ADN Cuba
        {
          source: "adncuba",
          urgent: false,
          category: "Tecnología",
          title: "Jóvenes cubanos desarrollan apps innovadoras",
          summary: "El talento tecnológico cubano brilla con creaciones propias.",
          author: "Redacción Tecnología",
          body: "Desde sus casas, jóvenes programadores crean soluciones...\n\nLas aplicaciones abordan problemas cotidianos de los cubanos.\n\nFalta de conectividad sigue siendo un desafío.",
          reads: 2100,
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ];

      await Article.insertMany(articles);
      console.log(`✅ ${articles.length} artículos insertados correctamente`);
    } else {
      console.log(`📊 Ya existen ${articleCount} artículos en la base de datos`);
    }

    console.log("✅ Seed completado exitosamente");
    return { success: true };
  } catch (err) {
    console.error("❌ Error en seed:", err);
    throw err;
  }
}

module.exports = seedDatabase;
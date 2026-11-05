// Chargement des variables d'environnement EN PREMIER
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/database');

// Port d'écoute (depuis .env, fallback 5000)
const PORT = process.env.PORT || 5000;

/**
 * Démarrage du serveur :
 * 1. Connexion à MongoDB
 * 2. Démarrage du serveur Express
 */
const startServer = async () => {
  // 1. Connexion DB (bloquant : on attend le succès)
  await connectDB();

  // 2. Démarrage HTTP
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`🌍 Environnement : ${process.env.NODE_ENV || 'development'}`);
    console.log(`👉 Test rapide : http://localhost:${PORT}/api/health`);
  });
};

startServer();
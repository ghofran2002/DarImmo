const mongoose = require('mongoose');

/**
 * Connexion à MongoDB Atlas via Mongoose.
 *
 * Cette fonction est appelée une seule fois au démarrage du serveur.
 * Elle utilise la variable d'environnement MONGODB_URI définie dans .env.
 *
 * En cas de succès : log les infos de connexion.
 * En cas d'échec  : log l'erreur et arrête le processus (code 1).
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
    console.log(`📦 Base de données : ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Erreur de connexion MongoDB : ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
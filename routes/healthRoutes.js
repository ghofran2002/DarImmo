const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * GET /api/health
 *
 * Route publique de santé du serveur.
 * Utile pour :
 *  - Vérifier que l'API tourne
 *  - Vérifier la connexion DB
 *  - Permettre aux équipes Frontend de savoir si le backend est up
 */
router.get('/', (req, res) => {
  // État de la connexion Mongoose (0=disconnected, 1=connected, ...)
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    message: 'DarImmo API is running',
    data: {
      server: 'ok',
      database: dbStates[dbStatus] || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;
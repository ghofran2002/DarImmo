const express = require('express');
const cors = require('cors');
const morgan = require('morgan');


// Import des routes
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Import des middlewares d'erreur
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Initialisation de l'application Express
const app = express();

// ============================================
// MIDDLEWARES GLOBAUX
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================
// ROUTES
// ============================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Bienvenue sur l'API DarImmo 🏠",
    data: {
      documentation: '/api/health',
      version: '1.0.0',
    },
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);



// ============================================
// GESTION DES ERREURS (TOUJOURS EN DERNIER)
// ============================================
app.use(notFound);      // 1. catch-all 404
app.use(errorHandler);  // 2. gestionnaire d'erreurs

module.exports = app;
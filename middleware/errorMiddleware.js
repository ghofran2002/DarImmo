/**
 * Middleware de gestion centralisée des erreurs.
 *
 * À placer EN DERNIER dans app.js, après toutes les routes.
 * Capture toutes les erreurs passées à next(err).
 *
 * En développement : renvoie le stack trace pour débugger.
 * En production    : renvoie un message générique.
 */
const errorHandler = (err, req, res, next) => {
  // Si le status n'est pas défini, on met 500 par défaut
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Erreur serveur';

  // Cas spécial : CastError Mongoose (ObjectId invalide)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Ressource introuvable';
  }

  // Cas spécial : duplicate key MongoDB (email déjà pris)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Cette valeur existe déjà pour le champ '${field}'`;
  }

  // Cas spécial : ValidationError Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: [],
    // Stack trace uniquement en développement
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware 404 — route introuvable.
 * À placer APRÈS toutes les routes mais AVANT errorHandler.
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
    errors: [],
  });
};

module.exports = { errorHandler, notFound };
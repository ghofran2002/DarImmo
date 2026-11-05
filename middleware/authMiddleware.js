const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Middleware protect — vérifie le JWT et attache l'utilisateur à req.user.
 *
 * Flow :
 *  1. Lit le header Authorization: "Bearer <token>"
 *  2. Vérifie la signature du token avec JWT_SECRET
 *  3. Charge l'utilisateur depuis la DB
 *  4. Attache req.user = user
 *  5. Passe au controller suivant
 *
 * En cas d'erreur → 401 Unauthorized.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Vérifier la présence du header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extraire le token : "Bearer abc.def.ghi" → "abc.def.ghi"
      token = req.headers.authorization.split(' ')[1];

      // 3. Vérifier la signature + expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Charger l'utilisateur (sans le password)
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur introuvable',
          errors: [],
        });
      }

      // 5. Passer au controller
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
        errors: [],
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé : token manquant',
      errors: [],
    });
  }
});

/**
 * Middleware authorize — vérifie que l'utilisateur a un rôle autorisé.
 * À utiliser APRÈS protect.
 *
 * Usage : router.delete('/:id', protect, authorize('admin'), controller)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé',
        errors: [],
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé : rôle '${req.user.role}' non autorisé`,
        errors: [],
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
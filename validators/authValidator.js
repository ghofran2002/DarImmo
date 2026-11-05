const { body, validationResult } = require('express-validator');

/**
 * Middleware qui exécute toutes les validations accumulées
 * et renvoie une réponse 400 si des erreurs existent.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

/**
 * Règles de validation pour POST /api/auth/register
 */
const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),

  body('email')
    .trim()
    .notEmpty().withMessage("L'email est obligatoire")
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any').withMessage('Numéro de téléphone invalide'),

  body('role')
    .optional()
    .isIn(['user', 'agent']).withMessage('Rôle invalide (user ou agent uniquement)'),

  validate,
];

/**
 * Règles de validation pour POST /api/auth/login
 */
const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage("L'email est obligatoire")
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire'),

  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
};
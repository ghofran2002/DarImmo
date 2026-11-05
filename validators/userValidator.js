const { body, validationResult } = require('express-validator');

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

const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('phone').optional().trim().matches(/^\+?[0-9\s\-()]{8,15}$/).withMessage('Numéro de téléphone invalide (8 à 15 chiffres, + optionnel)'),
  body('avatar').optional().trim().isURL().withMessage("L'avatar doit être une URL valide"),
  validate,
];

const updatePasswordValidator = [
  body('currentPassword').notEmpty().withMessage("L'ancien mot de passe est obligatoire"),
  body('newPassword').notEmpty().withMessage('Le nouveau mot de passe est obligatoire').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères').custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("Le nouveau mot de passe doit être différent de l'ancien");
      }
      return true;
    }),
  validate,
];

module.exports = {
  updateProfileValidator,
  updatePasswordValidator,
};
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};

const createPropertyValidator = [
  body('title').trim().notEmpty().withMessage('Le titre est obligatoire').isLength({ min: 5, max: 100 }).withMessage('Le titre doit contenir entre 5 et 100 caractères'),
  body('description').trim().notEmpty().withMessage('La description est obligatoire').isLength({ min: 20 }).withMessage('La description doit contenir au moins 20 caractères'),
  body('price').notEmpty().withMessage('Le prix est obligatoire').isNumeric().withMessage('Le prix doit être un nombre').isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
  body('type').notEmpty().withMessage('Le type est obligatoire').isIn(['apartment', 'house', 'villa', 'land', 'studio', 'office']).withMessage('Type de bien invalide'),
  body('transactionType').notEmpty().withMessage('Le type de transaction est obligatoire').isIn(['sale', 'rent']).withMessage('Type de transaction invalide (sale ou rent)'),
  body('city').trim().notEmpty().withMessage('La ville est obligatoire'),
  body('address').trim().notEmpty().withMessage("L'adresse est obligatoire"),
  body('surface').notEmpty().withMessage('La surface est obligatoire').isFloat({ min: 1 }).withMessage('La surface doit être positive'),
  body('rooms').optional().isInt({ min: 0 }).withMessage('Le nombre de pièces doit être un entier positif'),
  body('bedrooms').optional().isInt({ min: 0 }).withMessage('Le nombre de chambres doit être un entier positif'),
  body('bathrooms').optional().isInt({ min: 0 }).withMessage('Le nombre de salles de bain doit être un entier positif'),
  
  // ⚠️ AJOUT : Validation de la géolocalisation (GeoJSON)
  body('location')
    .notEmpty().withMessage('La localisation est obligatoire')
    .isObject().withMessage('La localisation doit être un objet GeoJSON'),
  
  body('location.type')
    .equals('Point').withMessage('Le type de localisation doit être "Point"'),

  body('location.coordinates')
    .isArray({ min: 2, max: 2 }).withMessage('Les coordonnées doivent contenir exactement [longitude, latitude]')
    .custom((coords) => {
      const [lng, lat] = coords;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error('Les coordonnées doivent être des nombres');
      }
      if (lng < -180 || lng > 180) {
        throw new Error('La longitude doit être comprise entre -180 et 180');
      }
      if (lat < -90 || lat > 90) {
        throw new Error('La latitude doit être comprise entre -90 et 90');
      }
      return true;
    }),

  validate,
];

const updatePropertyValidator = [
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Le titre doit contenir entre 5 et 100 caractères'),
  body('description').optional().trim().isLength({ min: 20 }).withMessage('La description doit contenir au moins 20 caractères'),
  body('price').optional().isNumeric().withMessage('Le prix doit être un nombre').isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
  body('type').optional().isIn(['apartment', 'house', 'villa', 'land', 'studio', 'office']).withMessage('Type de bien invalide'),
  body('transactionType').optional().isIn(['sale', 'rent']).withMessage('Type de transaction invalide'),
  body('city').optional().trim().notEmpty().withMessage('La ville est obligatoire'),
  body('address').optional().trim().notEmpty().withMessage("L'adresse est obligatoire"),
  body('surface').optional().isFloat({ min: 1 }).withMessage('La surface doit être positive'),
  
  // ⚠️ AJOUT : Validation de la géolocalisation (Optionnelle pour la mise à jour)
  body('location')
    .optional()
    .isObject().withMessage('La localisation doit être un objet GeoJSON'),
  
  body('location.type')
    .optional()
    .equals('Point').withMessage('Le type de localisation doit être "Point"'),

  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 }).withMessage('Les coordonnées doivent contenir exactement [longitude, latitude]')
    .custom((coords) => {
      if (!coords) return true;
      const [lng, lat] = coords;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error('Les coordonnées doivent être des nombres');
      }
      if (lng < -180 || lng > 180) {
        throw new Error('La longitude doit être comprise entre -180 et 180');
      }
      if (lat < -90 || lat > 90) {
        throw new Error('La latitude doit être comprise entre -90 et 90');
      }
      return true;
    }),

  validate,
];

module.exports = { createPropertyValidator, updatePropertyValidator };
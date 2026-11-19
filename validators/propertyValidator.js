// backend/validators/propertyValidator.js
const { body, validationResult } = require('express-validator');
const {
  normalizeTypeInput,
  normalizeTransactionInput,
} = require('../utils/typeMapping');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation échouée',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Sanitizer : convertit 'appartement' -> 'apartment', 'acheter' -> 'sale', etc.
const normalizePropertyBody = (req, res, next) => {
  if (req.body?.type) {
    req.body.type = normalizeTypeInput(req.body.type);
  }
  if (req.body?.transactionType) {
    req.body.transactionType = normalizeTransactionInput(req.body.transactionType);
  }
  next();
};

const createPropertyValidator = [
  normalizePropertyBody,
  body('title').isString().trim().isLength({ min: 5, max: 100 }),
  body('description').isString().trim().isLength({ min: 20 }),
  body('price').isNumeric().toFloat(),
  body('type').isIn(['apartment', 'house', 'villa', 'land', 'studio', 'office']),
  body('transactionType').isIn(['sale', 'rent']),
  body('city').isString().trim().notEmpty(),
  body('address').isString().trim().notEmpty(),
  body('surface').isNumeric().toFloat(),
  body('location.coordinates').isArray({ min: 2, max: 2 }),
  handleValidationErrors,
];

const updatePropertyValidator = [
  normalizePropertyBody,
  body('title').optional().isString().trim().isLength({ min: 5, max: 100 }),
  body('description').optional().isString().trim().isLength({ min: 20 }),
  body('price').optional().isNumeric().toFloat(),
  body('type').optional().isIn(['apartment', 'house', 'villa', 'land', 'studio', 'office']),
  body('transactionType').optional().isIn(['sale', 'rent']),
  handleValidationErrors,
];

module.exports = {
  createPropertyValidator,
  updatePropertyValidator,
};
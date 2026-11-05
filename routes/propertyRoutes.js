const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');


const {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getNearbyProperties,
  uploadImages,
  deleteImage,
  
} = require('../controllers/propertyController');

const {
  createPropertyValidator,
  updatePropertyValidator,
} = require('../validators/propertyValidator');

const { protect } = require('../middleware/authMiddleware');

// Routes publiques
router.get('/', getAllProperties);
router.get('/nearby', getNearbyProperties); 
router.get('/:id', getPropertyById);

// Routes privées (authentification requise)
router.post('/', protect, createPropertyValidator, createProperty);
router.put('/:id', protect, updatePropertyValidator, updateProperty);
router.delete('/:id', protect, deleteProperty);
// Upload d'images (max 5 par requête)
router.post('/:id/images', protect, upload.array('images', 5), uploadImages);

// Suppression d'une image spécifique
// Le :publicId doit être encodé dans l'URL (ex: darimmo%2Fproperties%2Fabc123)
router.delete('/:id/images/:publicId', protect, deleteImage);

module.exports = router;
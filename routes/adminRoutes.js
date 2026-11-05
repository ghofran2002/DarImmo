const express = require('express');
const router = express.Router();
const { getPendingProperties, approveProperty, rejectProperty, getAllUsers } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Toutes ces routes nécessitent d'être connecté ET d'avoir le rôle 'admin'
router.use(protect);
router.use(authorize('admin'));

router.get('/properties/pending', getPendingProperties);
router.put('/properties/:id/approve', approveProperty);
router.put('/properties/:id/reject', rejectProperty);
router.get('/users', getAllUsers);

module.exports = router;
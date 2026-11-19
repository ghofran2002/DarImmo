const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const { protect } = require('../middleware/authMiddleware');

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', registerValidator, register);

/**
 * POST /api/auth/login
 * Connexion
 */
router.post('/login', loginValidator, login);

// ============================================
// ROUTES PRIVÉES (nécessitent un JWT)
// ============================================

/**
 * GET /api/auth/me
 * Récupérer le profil de l'utilisateur connecté
 */
router.get('/me', protect, getMe);

module.exports = router;
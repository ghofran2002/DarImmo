const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  // 1. Vérifier si l'email existe déjà
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Un utilisateur avec cet email existe déjà',
      errors: [],
    });
  }

  // 2. Créer l'utilisateur (le password sera hashé par le hook pre('save'))
  const user = await User.create({
    name,
    email,
    password,
    phone: phone || null,
    role: role || 'user', // par défaut 'user'
  });

  // 3. Générer le token
  const token = generateToken(user._id, user.role);

  // 4. Répondre (sans le password — select: false le protège déjà)
  res.status(201).json({
    success: true,
    message: 'Utilisateur créé avec succès',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

/**
 * @desc    Connexion d'un utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Chercher l'utilisateur AVEC le password (select: false par défaut)
  const user = await User.findOne({ email }).select('+password');

  // 2. Vérifier email + password
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Email ou mot de passe incorrect',
      errors: [],
    });
  }

  // 3. Générer le token
  const token = generateToken(user._id, user.role);

  // 4. Répondre
  res.status(200).json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

/**
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @route   GET /api/auth/me
 * @access  Private (protect)
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user a été attaché par le middleware protect
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Profil récupéré avec succès',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
});

module.exports = {
  register,
  login,
  getMe,
};
const Favorite = require('../models/Favorite');
const Property = require('../models/Property');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Ajouter une annonce aux favoris
// @route   POST /api/favorites/:propertyId
// @access  Private
const addFavorite = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  // Vérifier que l'annonce existe
  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });
  }

  try {
    const favorite = await Favorite.create({
      user: req.user._id,
      property: propertyId,
    });

    res.status(201).json({
      success: true,
      message: 'Annonce ajoutée aux favoris',
      data: { favorite },
    });
  } catch (error) {
    // Gérer l'erreur de doublon (code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Cette annonce est déjà dans vos favoris',
        errors: [],
      });
    }
    throw error;
  }
});

// @desc    Supprimer une annonce des favoris
// @route   DELETE /api/favorites/:propertyId
// @access  Private
const removeFavorite = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const favorite = await Favorite.findOneAndDelete({
    user: req.user._id,
    property: propertyId,
  });

  if (!favorite) {
    return res.status(404).json({
      success: false,
      message: "Cette annonce n'est pas dans vos favoris",
      errors: [],
    });
  }

  res.status(200).json({
    success: true,
    message: 'Annonce retirée des favoris',
    data: {},
  });
});

// @desc    Lister les favoris de l'utilisateur connecté
// @route   GET /api/favorites
// @access  Private
const getMyFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id }).populate({
    path: 'property',
    populate: { path: 'owner', select: 'name email' },
  });

  res.status(200).json({
    success: true,
    message: 'Favoris récupérés',
    data: {
      count: favorites.length,
      favorites,
    },
  });
});

module.exports = { addFavorite, removeFavorite, getMyFavorites };
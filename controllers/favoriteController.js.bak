// backend/controllers/favoriteController.js
const Favorite = require('../models/Favorite');
const Property = require('../models/Property');
const asyncHandler = require('../utils/asyncHandler');
const { serializeProperty } = require('../utils/serializers');

const addFavorite = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });
  }
  try {
    const favorite = await Favorite.create({ user: req.user._id, property: propertyId });
    res.status(201).json({ success: true, message: 'Ajoutee aux favoris', data: { favorite } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Deja en favoris', errors: [] });
    }
    throw error;
  }
});

const removeFavorite = asyncHandler(async (req, res) => {
  const favorite = await Favorite.findOneAndDelete({
    user: req.user._id,
    property: req.params.propertyId,
  });
  if (!favorite) {
    return res.status(404).json({ success: false, message: 'Pas dans les favoris', errors: [] });
  }
  res.status(200).json({ success: true, message: 'Retire des favoris', data: {} });
});

const getMyFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id }).populate({
    path: 'property',
    populate: { path: 'owner', select: 'name email' },
  });
  const properties = favorites
    .filter((f) => f.property)
    .map((f) =>
      serializeProperty(f.property, {
        userId: req.user._id,
        favIds: new Set([String(f.property._id)]),
      })
    );
  res.status(200).json({
    success: true,
    message: 'Favoris recuperes',
    data: { count: properties.length, properties },
  });
});

module.exports = { addFavorite, removeFavorite, getMyFavorites };

const Property = require('../models/Property');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendPushNotification } = require('../services/notificationService');

// Voir les annonces en attente
const getPendingProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ status: 'pending' }).populate('owner', 'name email');
  res.status(200).json({ success: true, message: 'Annonces en attente', data: { count: properties.length, properties } });
});

// Approuver une annonce
const approveProperty = asyncHandler(async (req, res) => {
  const property = await Property.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
  if (!property) return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });

  await sendPushNotification(property.owner, {
    title: 'Annonce approuvée',
    body: `Votre annonce "${property.title}" a été approuvée.`,
    type: 'property_approved',
    data: { propertyId: property._id }
  });

  res.status(200).json({ success: true, message: 'Annonce approuvée', data: { property } });
});

// Rejeter une annonce
const rejectProperty = asyncHandler(async (req, res) => {
  const property = await Property.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
  if (!property) return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });

  await sendPushNotification(property.owner, {
    title: 'Annonce rejetée',
    body: `Votre annonce "${property.title}" a été rejetée.`,
    type: 'property_rejected',
    data: { propertyId: property._id }
  });

  res.status(200).json({ success: true, message: 'Annonce rejetée', data: { property } });
});

// Voir tous les utilisateurs
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({ success: true, message: 'Utilisateurs récupérés', data: { count: users.length, users } });
});

module.exports = { getPendingProperties, approveProperty, rejectProperty, getAllUsers };
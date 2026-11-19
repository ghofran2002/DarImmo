const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Récupérer les notifications de l'utilisateur connecté
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50); // Limiter à 50 pour éviter les grosses requêtes

  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

  res.status(200).json({
    success: true,
    message: 'Notifications récupérées',
    data: {
      count: notifications.length,
      unreadCount,
      notifications,
    },
  });
});

// @desc    Marquer une notification comme lue
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id, // Vérifier que la notif appartient à l'utilisateur
  });

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification introuvable', errors: [] });
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notification marquée comme lue',
    data: { notification },
  });
});

// @desc    Marquer toutes les notifications comme lues
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: 'Toutes les notifications ont été marquées comme lues',
    data: {},
  });
});
const User = require('../models/User'); // ⚠️ Ajoute cet import en haut

// @desc    Enregistrer un token d'appareil
// @route   POST /api/notifications/device-token
// @access  Private
const registerDeviceToken = asyncHandler(async (req, res) => {
  const { token, device } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Le token est obligatoire', errors: [] });
  }

  const user = await User.findById(req.user._id);

  const existingToken = user.fcmTokens.find((t) => t.token === token);
  
  if (existingToken) {
    existingToken.createdAt = new Date();
  } else {
    user.fcmTokens.push({ token, device: device || 'unknown' });
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Token d'appareil enregistré avec succès",
    data: { tokensCount: user.fcmTokens.length },
  });
});
module.exports = { getMyNotifications, markAsRead, markAllAsRead , registerDeviceToken};
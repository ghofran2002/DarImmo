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

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
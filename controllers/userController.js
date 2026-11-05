const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    message: 'Profil récupéré avec succès',
    data: { user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar, createdAt: user.createdAt, updatedAt: user.updatedAt } },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
  await user.save();
  res.status(200).json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: { user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar, createdAt: user.createdAt, updatedAt: user.updatedAt } },
  });
});

const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect', errors: [] });
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({ success: true, message: 'Mot de passe mis à jour avec succès', data: {} });
});

module.exports = { getProfile, updateProfile, updatePassword };
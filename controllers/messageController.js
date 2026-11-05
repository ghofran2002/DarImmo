const Message = require('../models/Message');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Envoyer un message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { receiver, property, content } = req.body;

  // Vérifier que le destinataire existe
  const receiverExists = await User.findById(receiver);
  if (!receiverExists) {
    return res.status(404).json({ success: false, message: 'Destinataire introuvable', errors: [] });
  }

  // Empêcher de s'envoyer un message à soi-même
  if (receiver === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous envoyer un message à vous-même', errors: [] });
  }

  const message = await Message.create({
    sender: req.user._id,
    receiver,
    property: property || null,
    content,
  });

  res.status(201).json({
    success: true,
    message: 'Message envoyé',
    data: { message },
  });
});

// @desc    Récupérer la conversation avec un utilisateur
// @route   GET /api/messages/:userId
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Récupérer les messages entre les deux utilisateurs (dans les deux sens)
  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id },
    ],
  })
    .sort({ createdAt: 1 }) // Du plus ancien au plus récent
    .populate('sender', 'name email')
    .populate('receiver', 'name email')
    .populate('property', 'title price');

  // Marquer comme lus les messages reçus
  await Message.updateMany(
    { sender: userId, receiver: req.user._id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: 'Conversation récupérée',
    data: {
      count: messages.length,
      messages,
    },
  });
});

// @desc    Récupérer la liste des conversations (dernier message par interlocuteur)
// @route   GET /api/messages
// @access  Private
const getMyConversations = asyncHandler(async (req, res) => {
  // Agrégation MongoDB pour récupérer le dernier message par interlocuteur
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', req.user._id] },
            '$receiver',
            '$sender',
          ],
        },
        lastMessage: { $first: '$$ROOT' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        _id: 1,
        user: { _id: 1, name: 1, email: 1, avatar: 1 },
        lastMessage: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: 'Conversations récupérées',
    data: {
      count: conversations.length,
      conversations,
    },
  });
});

module.exports = { sendMessage, getConversation, getMyConversations };
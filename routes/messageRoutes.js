const express = require('express');
const router = express.Router();

const {
  sendMessage,
  getConversation,
  getMyConversations,
} = require('../controllers/messageController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyConversations);
router.post('/', sendMessage);
router.get('/:userId', getConversation);

module.exports = router;
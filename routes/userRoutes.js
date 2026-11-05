const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updatePassword } = require('../controllers/userController');
const { updateProfileValidator, updatePasswordValidator } = require('../validators/userValidator');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfileValidator, updateProfile);
router.put('/password', updatePasswordValidator, updatePassword);

module.exports = router;
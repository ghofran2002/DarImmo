const { admin, isFirebaseReady } = require('../config/firebase');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Envoie une notification (MongoDB + Push si configuré).
 */
const sendPushNotification = async (userId, payload) => {
  try {
    // 1. Sauvegarder dans MongoDB (pour l'historique dans l'app)
    const notification = await Notification.create({
      user: userId,
      type: payload.type,
      title: payload.title,
      message: payload.body,
      data: payload.data || {},
    });

    // 2. Récupérer les tokens FCM de l'utilisateur
    const user = await User.findById(userId).select('fcmTokens');
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`ℹ️ Aucun token FCM pour ${userId}. Notification sauvegardée en base.`);
      return notification;
    }

    const tokens = user.fcmTokens.map((t) => t.token);

    // 3. Envoi réel via Firebase
    if (isFirebaseReady && admin) {
      const message = {
        notification: { title: payload.title, body: payload.body },
        data: { type: payload.type, ...payload.data },
        tokens: tokens,
      };
      try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`✅ Push envoyé : ${response.successCount} succès, ${response.failureCount} échecs`);
      } catch (err) {
        console.error('❌ Erreur FCM:', err.message);
      }
    } else {
      // 4. Mode simulation
      console.log(`🔔 [SIMULATION] Push pour ${userId}: "${payload.title}" - "${payload.body}"`);
    }

    return notification;
  } catch (error) {
    console.error('❌ Erreur notificationService:', error.message);
    return null;
  }
};

module.exports = { sendPushNotification };
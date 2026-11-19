// Ce fichier tente de charger Firebase Admin.
// S'il n'y a pas de variables d'environnement, il ne plantera pas.

let admin = null;
let isFirebaseReady = false;

try {
  const hasConfig =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

  if (hasConfig) {
    const firebaseAdmin = require('firebase-admin');

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    // Détection de la version : v13 expose credential.cert, v14 expose cert dans les sous-modules
    if (firebaseAdmin.credential && typeof firebaseAdmin.credential.cert === 'function') {
      // === API v13 (legacy namespace) ===
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
      });
    } else {
      // === API v14 (modulaire) ===
      const { initializeApp, cert } = require('firebase-admin/app');
      const { getMessaging } = require('firebase-admin/messaging');
      initializeApp({ credential: cert(serviceAccount) });
      // On expose un objet `admin` minimal compatible avec notificationService.js
      firebaseAdmin.messaging = () => getMessaging();
    }

    admin = firebaseAdmin;
    isFirebaseReady = true;
    console.log('✅ Firebase Admin initialisé');
  } else {
    console.log('⚠️ Firebase non configuré (variables manquantes). Les push seront simulées.');
  }
} catch (error) {
  console.log('⚠️ Firebase non configuré. Les push seront simulées.');
  console.error('[firebase] cause :', error.message);
}

module.exports = { admin, isFirebaseReady };
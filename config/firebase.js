// Ce fichier tente de charger Firebase Admin.
// S'il n'y a pas de variables d'environnement, il ne plantera pas.

let admin = null;
let isFirebaseReady = false;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin = require('firebase-admin');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    isFirebaseReady = true;
    console.log('✅ Firebase Admin initialisé');
  } else {
    console.log('⚠️ Firebase non configuré (variables manquantes). Les push seront simulées.');
  }
} catch (error) {
  console.log('⚠️ Firebase non configuré. Les push seront simulées.');
}

module.exports = { admin, isFirebaseReady };
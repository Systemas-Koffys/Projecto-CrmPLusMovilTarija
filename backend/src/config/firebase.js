const admin = require('firebase-admin');
const path = require('path');

try {
  // Load credentials directly from the original JSON file copied by the user
  const serviceAccount = require(path.join(__dirname, '../../serviceAccountKey.json'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin initialized successfully using serviceAccountKey.json');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  throw error;
}

module.exports = admin;

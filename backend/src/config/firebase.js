const admin = require('firebase-admin');
const path = require('path');

  const fs = require('fs');
  let serviceAccount;

  // Render Docker secrets path
  const renderSecretPath = '/etc/secrets/serviceAccountKey.json';
  // Local development path
  const localSecretPath = path.join(__dirname, '../../serviceAccountKey.json');

  if (fs.existsSync(renderSecretPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(renderSecretPath, 'utf8'));
    console.log('Firebase Admin initialized successfully using Render Secret File');
  } else {
    serviceAccount = require(localSecretPath);
    console.log('Firebase Admin initialized successfully using local serviceAccountKey.json');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  throw error;
}

module.exports = admin;

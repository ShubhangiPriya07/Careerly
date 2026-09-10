const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const privateKey = process.env.FIREBASE_PRIVATE_KEY;

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey
    ? privateKey.replace(/\\n/g, "\n")
    : undefined,
};

initializeApp({
  credential: cert(serviceAccount),
});

const adminAuth = getAuth();

module.exports = adminAuth;
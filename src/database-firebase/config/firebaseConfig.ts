import fbAdmin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;
const FB_SA_PRIVATE_KEY = process.env.FB_SA_PRIVATE_KEY;
const FB_SA_CLIENT_EMAIL = process.env.FB_SA_CLIENT_EMAIL;
export const projectId = FIREBASE_PROJECT_ID;
export const databaseURL = FIREBASE_DB_URL;
const adminConfig: ServiceAccount = {
  projectId: FIREBASE_PROJECT_ID,
  privateKey: FB_SA_PRIVATE_KEY,
  clientEmail: FB_SA_CLIENT_EMAIL,
};
export const credential = fbAdmin.credential.cert(adminConfig);

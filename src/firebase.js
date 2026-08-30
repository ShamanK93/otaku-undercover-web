import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Les valeurs viennent d'un fichier .env (voir .env.example et le README,
// section "Mode en ligne") — jamais codées en dur ici.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseReady = Boolean(firebaseConfig.databaseURL && firebaseConfig.apiKey);

let app = null;
let db = null;

if (firebaseReady) {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} else {
  // eslint-disable-next-line no-console
  console.warn(
    'Firebase non configuré : copie .env.example en .env et renseigne tes clés de projet Firebase pour activer le mode en ligne.'
  );
}

export { db };

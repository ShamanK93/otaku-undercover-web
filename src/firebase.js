import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator } from 'firebase/auth';

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
let auth = null;

// Chaque visiteur reçoit une identité anonyme Firebase (sans compte ni
// e-mail), gardée par le navigateur. Les règles de sécurité de la base
// (database.rules.json) s'appuient dessus : un joueur ne peut modifier que
// sa propre fiche, et seuls les membres d'un salon peuvent y écrire.
// authReady se résout avec l'identifiant du joueur, ou null en cas d'échec.
let authReady = Promise.resolve(null);
let authError = null;

if (firebaseReady) {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);
  // Développement uniquement : VITE_FIREBASE_EMULATOR=1 branche le site sur
  // les émulateurs Firebase locaux (pour tester database.rules.json).
  if (import.meta.env.VITE_FIREBASE_EMULATOR === '1') {
    connectDatabaseEmulator(db, '127.0.0.1', 9000);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  }
  authReady = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribe();
        resolve(user.uid);
      }
    });
    signInAnonymously(auth).catch((error) => {
      authError = error;
      unsubscribe();
      resolve(null);
    });
  });
} else {
  // eslint-disable-next-line no-console
  console.warn(
    'Firebase non configuré : copie .env.example en .env et renseigne tes clés de projet Firebase pour activer le mode en ligne.'
  );
}

// Identifiant du joueur connecté (disponible une fois authReady résolu).
export function getCurrentUid() {
  return auth && auth.currentUser ? auth.currentUser.uid : null;
}

export function getAuthError() {
  return authError;
}

export { db, authReady };

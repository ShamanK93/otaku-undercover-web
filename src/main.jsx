import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { authReady } from './firebase';
import { cleanupOldRooms } from './utils/room';
import './index.css';

// On attend l'identité anonyme Firebase avant d'afficher l'app : les règles
// de la base en ont besoin pour chaque lecture et écriture.
authReady.then((uid) => {
  // Ménage discret des vieux salons, sans bloquer l'affichage.
  if (uid) cleanupOldRooms().catch(() => {});
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

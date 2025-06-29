import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals';

// Désactiver les logs en console en production
// et optionnellement en développement si l'URL contient ?silent=true
const suppressConsole = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const silentMode = urlParams.get('silent') === 'true';

  if (process.env.NODE_ENV === 'production' || silentMode) {
    // Sauvegarder les méthodes originales de console
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    // Remplacer les méthodes de console par des fonctions vides
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    console.info = () => {};

    // Permettre de restaurer la console si nécessaire
    window.restoreConsole = () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      return 'Console logs restored';
    };
  }
};

// Appliquer la suppression des logs si nécessaire
suppressConsole();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

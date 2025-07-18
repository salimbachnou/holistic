# Holistic Frontend

Interface utilisateur pour la plateforme Holistic.ma, une application dédiée au bien-être et aux services holistiques.

## Installation

```bash
# Installation des dépendances
npm install
```

## Démarrage

```bash
# Démarrer l'application en mode développement
npm start
```

L'application sera accessible à l'adresse [https://holistic-maroc.vercel.app](https://holistic-maroc.vercel.app).

## Problèmes courants et solutions

### Erreur de connexion au backend

Si vous rencontrez des erreurs comme:
```
GET https://holistic-maroc.vercel.app/api/professionals? 404 (Not Found)
```

#### Solutions:

1. **Vérifiez que le serveur backend est démarré**:
   ```bash
   cd ../backend
   npm run dev
   ```

2. **L'application utilise automatiquement des données de démonstration**:
   - Même sans backend, l'application fonctionne avec des données mockées
   - Un message "Le serveur est indisponible. Les données affichées sont des exemples." s'affiche

### Erreur de géolocalisation

Si vous voyez:
```
Error getting location: GeolocationPositionError {code: 1, message: 'User denied Geolocation'}
```

#### Solutions:

1. **Autoriser la géolocalisation**:
   - Cliquez sur l'icône de cadenas dans la barre d'adresse
   - Accordez les permissions de localisation

2. **Fonctionnement sans géolocalisation**:
   - L'application fonctionne même sans accès à la localisation
   - Les résultats ne seront pas filtrés par proximité

### Supprimer les logs d'erreur dans la console

Pour masquer les erreurs dans la console qui ne sont pas critiques:

1. **Mode silencieux en développement**:
   - Ajoutez `?silent=true` à l'URL: https://holistic-maroc.vercel.app/?silent=true
   - Cela désactive tous les logs dans la console

2. **Restaurer les logs si nécessaire**:
   - Ouvrez la console développeur et tapez: `window.restoreConsole()`
   - Les logs réapparaîtront

3. **En production**:
   - Les logs sont automatiquement désactivés

## Structure du projet

- `src/components/` - Composants réutilisables
- `src/pages/` - Pages principales de l'application
- `src/contexts/` - Contextes React (AuthContext, etc.)
- `src/mocks/` - Données mockées pour le développement
- `src/utils/` - Fonctions utilitaires

## Configuration du proxy

Le fichier `src/setupProxy.js` configure le proxy pour rediriger les requêtes API vers le backend. En mode développement, toutes les requêtes vers `/api/*` sont redirigées vers `https://holistic-maroc-backend.onrender.com`.

## Fonctionnalités principales

- **Authentification** - Connexion/inscription des utilisateurs
- **Recherche de professionnels** - Filtrage par catégorie, localisation, etc.
- **Prise de rendez-vous** - Réservation de sessions avec des professionnels
- **Paiement en ligne** - Sécurisé et intégré
- **Gestion des favoris** - Sauvegarde des professionnels préférés
- **Tableau de bord** - Gestion des rendez-vous, messages, etc.

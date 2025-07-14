# Holistic Platform

## Configuration rapide

Pour lancer le projet complet (frontend et backend) avec une seule commande:

1. Installez d'abord toutes les dépendances:
   ```
   npm run install-all
   ```

2. Lancez le projet complet:
   ```
   npm run dev
   ```

Cette commande lancera simultanément:
- Le backend sur http://localhost:5000
- Le frontend sur http://localhost:3000

## Commandes individuelles

Si vous préférez lancer les services séparément:

- Pour le backend uniquement:
  ```
  npm run backend
  ```

- Pour le frontend uniquement:
  ```
  npm run frontend
  ```

## Structure du projet

- `/backend` - API REST Node.js/Express
- `/frontend` - Application React 
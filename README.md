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
- Le backend sur http://hamza-aourass.ddns.net:5001
- Le frontend sur http://hamza-aourass.ddns.net:3002

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
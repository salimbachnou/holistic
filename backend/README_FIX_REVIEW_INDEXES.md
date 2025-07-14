# Résolution du problème d'index MongoDB pour les avis

## Problème

L'erreur `E11000 duplicate key error collection: holistic.reviews index: userId_1_targetId_1_targetType_1` indique qu'il existe un ancien index unique dans la base de données MongoDB qui ne correspond pas au schéma actuel du modèle Review.

### Ancien schéma (problématique)
- `userId`, `targetId`, `targetType`

### Nouveau schéma (actuel)
- `clientId`, `contentId`, `contentType`

## Solutions

### Option 1: Corriger les index (recommandé si vous avez des données)

1. Naviguez vers le dossier des scripts :
```bash
cd backend/scripts
```

2. Exécutez le script de correction :
```bash
node fixReviewIndexes.js
```

Ce script va :
- Lister tous les index actuels
- Supprimer l'ancien index problématique
- Créer le nouvel index unique correct

### Option 2: Réinitialiser complètement (si pas de données importantes)

1. Naviguez vers le dossier des scripts :
```bash
cd backend/scripts
```

2. Exécutez le script de réinitialisation :
```bash
node resetReviewIndexes.js
```

Ce script va :
- Vérifier si la collection contient des données
- Supprimer tous les index (sauf _id)
- Permettre à Mongoose de recréer les bons index

### Option 3: Correction manuelle avec MongoDB Shell

Si les scripts ne fonctionnent pas, utilisez MongoDB Shell :

```javascript
// Connectez-vous à MongoDB
mongosh

// Sélectionnez la base de données
use holistic

// Listez les index
db.reviews.getIndexes()

// Supprimez l'ancien index problématique
db.reviews.dropIndex("userId_1_targetId_1_targetType_1")

// Créez le nouvel index unique
db.reviews.createIndex(
  { clientId: 1, contentId: 1, contentType: 1 },
  { unique: true }
)
```

### Option 4: Via MongoDB Compass (interface graphique)

1. Ouvrez MongoDB Compass
2. Connectez-vous à votre base de données
3. Naviguez vers la collection `reviews`
4. Allez dans l'onglet "Indexes"
5. Supprimez l'index `userId_1_targetId_1_targetType_1`
6. Créez un nouvel index sur `clientId`, `contentId`, `contentType` avec l'option unique

## Prévention

Pour éviter ce problème à l'avenir :

1. **Toujours faire des migrations** lors des changements de schéma
2. **Documenter les changements** d'index
3. **Tester en environnement de développement** avant la production
4. **Sauvegarder la base de données** avant les modifications majeures

## Vérification

Après avoir appliqué une des solutions, testez en créant un nouvel avis. L'erreur devrait être résolue.

Si l'erreur persiste, vérifiez :
1. Que le serveur a été redémarré
2. Que vous êtes connecté à la bonne base de données
3. Que tous les anciens index ont été supprimés 
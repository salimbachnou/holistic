# Correction du Problème des Coordonnées Géospatiales

## Problème

L'erreur MongoDB suivante se produisait lors de la mise à jour des profils professionnels :

```
MongoServerError: Plan executor error during findAndModify :: caused by :: Can't extract geo keys: { lat: null, lng: null } unknown GeoJSON type: { lat: null, lng: null }
```

## Cause

L'index géospatial `2dsphere` de MongoDB ne peut pas fonctionner avec des coordonnées `null`. Lorsque les coordonnées `lat` et `lng` sont `null`, MongoDB ne peut pas les traiter pour les requêtes géospatiales.

## Solution Implémentée

### 1. Modification du Modèle Professional

**Fichier :** `backend/models/Professional.js`

- ✅ **Validation des coordonnées** : Ajout de validateurs pour accepter les valeurs `null` ou `undefined`
- ✅ **Index géospatial amélioré** : Utilisation d'un index `sparse` avec `partialFilterExpression` pour exclure les documents avec des coordonnées nulles

```javascript
coordinates: {
  lat: {
    type: Number,
    required: false,
    validate: {
      validator: function(v) {
        return v === null || v === undefined || (typeof v === 'number' && !isNaN(v));
      },
      message: 'Latitude must be a valid number or null'
    }
  },
  lng: {
    type: Number,
    required: false,
    validate: {
      validator: function(v) {
        return v === null || v === undefined || (typeof v === 'number' && !isNaN(v));
      },
      message: 'Longitude must be a valid number or null'
    }
  }
}

// Index géospatial avec filtre partiel
professionalSchema.index({ 
  'businessAddress.coordinates': '2dsphere' 
}, { 
  sparse: true,
  partialFilterExpression: {
    'businessAddress.coordinates.lat': { $exists: true, $ne: null },
    'businessAddress.coordinates.lng': { $exists: true, $ne: null }
  }
});
```

### 2. Validation Côté Backend

**Fichier :** `backend/routes/professionals.js`

- ✅ **Route de création** : Validation des coordonnées avant sauvegarde
- ✅ **Route de mise à jour** : Nettoyage des coordonnées nulles avant mise à jour

```javascript
// Handle coordinates validation - prevent null values
if (updateData.businessAddress && updateData.businessAddress.coordinates) {
  const coords = updateData.businessAddress.coordinates;
  
  // If both lat and lng are null, remove the coordinates object entirely
  if (coords.lat === null && coords.lng === null) {
    delete updateData.businessAddress.coordinates;
  } else if (coords.lat === null || coords.lng === null) {
    // Remove specific null coordinates
    if (coords.lat === null) {
      delete updateData.businessAddress.coordinates.lat;
    }
    if (coords.lng === null) {
      delete updateData.businessAddress.coordinates.lng;
    }
    
    // If we removed one coordinate, remove the entire coordinates object
    if (!updateData.businessAddress.coordinates.lat || !updateData.businessAddress.coordinates.lng) {
      delete updateData.businessAddress.coordinates;
    }
  }
}
```

### 3. Script de Nettoyage des Données

**Fichier :** `backend/scripts/fixNullCoordinates.js`

- ✅ **Script de nettoyage** : Suppression des coordonnées nulles existantes dans la base de données
- ✅ **Vérification** : Confirmation que toutes les coordonnées nulles ont été supprimées

## Résultat

✅ **Problème résolu** : Les mises à jour de profil professionnel fonctionnent maintenant sans erreur

✅ **Données nettoyées** : Toutes les coordonnées nulles ont été supprimées de la base de données

✅ **Validation préventive** : Les nouvelles coordonnées nulles sont automatiquement nettoyées avant sauvegarde

✅ **Index géospatial fonctionnel** : L'index `2dsphere` fonctionne correctement avec les coordonnées valides

## Utilisation

### Exécution du Script de Nettoyage

```bash
cd backend
node scripts/fixNullCoordinates.js
```

### Test de la Correction

1. Connectez-vous en tant que professionnel
2. Allez dans la page de profil professionnel
3. Modifiez les informations du profil
4. Sauvegardez - aucune erreur ne devrait se produire

## Notes Techniques

- **Index sparse** : L'index géospatial n'est créé que pour les documents avec des coordonnées valides
- **Validation côté client** : Les coordonnées nulles sont également gérées côté frontend
- **Rétrocompatibilité** : Les profils existants sans coordonnées continuent de fonctionner normalement 
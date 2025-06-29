# Page de Profil Professionnel - Documentation

## 📋 Vue d'ensemble

La page de profil professionnel (`ProfessionalProfilePage.js`) permet aux professionnels connectés de visualiser et modifier leurs informations de profil de manière intuitive et moderne.

## 🚀 Fonctionnalités Principales

### ✅ Spécifications Demandées Implémentées

1. **Images de couverture**

   - Carrousel d'images avec navigation
   - Upload de nouvelles images par drag & drop
   - Suppression d'images existantes
   - Placeholder attrayant si aucune image

2. **Titre/Nom professionnel**

   - Affichage du nom complet de l'utilisateur
   - Titre professionnel éditable
   - Badge de vérification pour les comptes vérifiés
   - Note moyenne avec nombre d'avis

3. **Description + Adresse**
   - Description détaillée avec formatage
   - Adresse complète
   - **Lien Google Maps automatique** - Génère automatiquement un lien vers Google Maps
   - Tags d'activités (Yoga, Méditation, etc.)

### 🎨 Fonctionnalités Bonus

- **Mode édition** : Interface en place pour modifier les informations
- **Statistiques** : Dashboard avec métriques importantes
- **Informations de contact** : Téléphone, email, site web
- **Horaires d'ouverture** : Planning hebdomadaire complet
- **Design responsif** : Adapté à tous les écrans
- **Animations fluides** : Transitions et effets visuels

## 📍 Navigation et Accès

### Routes disponibles :

- `/professional/profile` - Page de profil (professionnels uniquement)
- `/dashboard/professional` - Dashboard professionnel (avec lien vers le profil)

### Accès depuis le dashboard :

1. **Action rapide** : Carte "Mon Profil" dans les actions rapides
2. **Call-to-action** : Section "Optimisez votre profil" en bas de page

## 🛠️ Structure Technique

### Composant Principal

```javascript
ProfessionalProfilePage.js
├── Header avec images de couverture
├── Section principale (description, adresse)
├── Sidebar (stats, contact, horaires)
└── Modal d'upload d'images
```

### Protection des Routes

- Route protégée avec `requireRole="professional"`
- Vérification automatique du rôle utilisateur
- Redirection si non autorisé

### Gestion d'État

- `useState` pour l'édition, chargement, données
- `useForm` (react-hook-form) pour la validation
- `useAuth` pour les données utilisateur

## 📱 Interface Utilisateur

### Layout Responsive

- **Desktop** : Layout 2/3 + 1/3 (contenu principal + sidebar)
- **Mobile** : Stack vertical adaptatif
- **Header** : Pleine largeur avec overlay d'informations

### Éléments Visuels

- **Thème Lotus** : Couleurs primary/purple cohérentes
- **Cards** : Style `lotus-card` avec ombres
- **Boutons** : `btn-primary` et `btn-secondary`
- **Icons** : Heroicons pour la cohérence

### Interactions

- **Mode lecture** : Affichage des informations
- **Mode édition** : Formulaires de modification
- **Upload images** : Modal avec zone de drop
- **Lien carte** : Ouverture dans nouvel onglet

## 🗺️ Fonctionnalité Carte

La fonctionnalité de lien vers Google Maps est implémentée via la fonction `generateMapLink()` :

```javascript
const generateMapLink = address => {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
};
```

**Avantages :**

- Pas besoin d'API Google Maps
- Fonctionne universellement
- Ouverture automatique dans l'app Maps mobile
- Géolocalisation automatique de l'adresse

## 🔄 Intégration Future

### APIs à connecter

- `GET /api/professional/profile` - Charger les données
- `PUT /api/professional/profile` - Mettre à jour le profil
- `POST /api/upload/images` - Upload d'images
- `DELETE /api/images/:id` - Supprimer une image

### Extensions possibles

- **Galerie photos** : Plus d'images avec lightbox
- **Certifications** : Section dédiée aux diplômes
- **Réseaux sociaux** : Liens Instagram, Facebook
- **Calendrier** : Intégration des disponibilités
- **Avis clients** : Section des témoignages

## 🎯 Utilisation

1. **Se connecter** en tant que professionnel
2. **Accéder au dashboard** `/dashboard/professional`
3. **Cliquer sur "Mon Profil"** ou utiliser `/professional/profile`
4. **Visualiser** les informations actuelles
5. **Cliquer "Modifier"** pour éditer
6. **Sauvegarder** les modifications

---

## 📝 Notes de Développement

- Données actuellement mockées pour la démonstration
- Interface prête pour l'intégration API
- Design system cohérent avec le reste de l'application
- Code modulaire et réutilisable
- Gestion d'erreurs intégrée

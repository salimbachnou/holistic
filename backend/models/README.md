# Structure de Base de Données MongoDB - Holistic Platform

Cette documentation décrit la structure complète de la base de données MongoDB pour la plateforme Holistic, une plateforme de bien-être connectant clients et professionnels.

## 📋 Collections Principales

### 1. **Users** (`User.js`)
Collection principale pour tous les utilisateurs (clients, professionnels, admins).

**Champs principaux :**
- `role`: "client" | "professional" | "admin"
- `name`: Nom complet de l'utilisateur
- `email`: Email unique
- `phone`: Numéro de téléphone
- `location`: Localisation textuelle
- `favourites`: Liste d'IDs de professionnels/produits favoris
- `bookings`: Références vers les réservations
- `orders`: Références vers les commandes
- `googleId`: ID pour l'authentification OAuth2

**Relations :**
- 1:N avec Bookings (client)
- 1:N avec Orders (client)
- 1:1 avec Professional (professionnel)

---

### 2. **Professionals** (`Professional.js`)
Profils des professionnels de bien-être.

**Champs principaux :**
- `userId`: Référence vers User
- `title`: Titre professionnel
- `description`: Description des services
- `address`: Adresse physique
- `coverImages`: Images de profil/couverture
- `activities`: Liste des activités (["Yoga", "Maternity"])
- `products`: Références vers les produits
- `sessions`: Références vers les sessions
- `events`: Références vers les événements
- `paymentEnabled`: Paiement en ligne activé
- `bookingMode`: "auto" | "manual"

**Relations :**
- N:1 avec User
- 1:N avec Products
- 1:N avec Sessions
- 1:N avec Events
- 1:N avec Bookings

---

### 3. **Products** (`Product.js`)
Produits vendus par les professionnels.

**Champs principaux :**
- `professionalId`: Référence vers Professional
- `title`: Nom du produit
- `description`: Description détaillée
- `images`: URLs des images
- `price`: Prix en nombre
- `composition`: Composition/ingrédients
- `sizeOptions`: Options de taille disponibles
- `reviews`: Références vers les avis

**Relations :**
- N:1 avec Professional
- 1:N avec Reviews
- 1:N avec Orders

---

### 4. **Sessions** (`Session.js`)
Sessions proposées par les professionnels.

**Champs principaux :**
- `professionalId`: Référence vers Professional
- `title`: Titre de la session
- `description`: Description détaillée
- `startTime`: Date/heure de début
- `duration`: Durée en minutes
- `maxParticipants`: Nombre maximum de participants
- `price`: Prix de la session
- `participants`: Liste des participants (références User)

**Relations :**
- N:1 avec Professional
- N:N avec Users (participants)
- 1:N avec Bookings

---

### 5. **Events** (`Event.js`)
Événements organisés par les professionnels.

**Champs principaux :**
- `professionalId`: Référence vers Professional
- `title`: Titre de l'événement
- `description`: Description
- `date`: Date de l'événement
- `location`: Lieu
- `price`: Prix
- `maxParticipants`: Participants maximum
- `bookingType`: "message" | "pay_online" | "pay_in_person"

**Relations :**
- N:1 avec Professional
- 1:N avec Bookings

---

### 6. **Bookings** (`Booking.js`)
Réservations de sessions/événements.

**Champs principaux :**
- `clientId`: Référence vers User (client)
- `professionalId`: Référence vers Professional
- `sessionId`: Référence vers Session (optionnelle)
- `status`: "pending" | "confirmed" | "declined" | "cancelled"
- `paymentStatus`: "paid" | "unpaid"
- `paymentMethod`: "online" | "in_person"

**Relations :**
- N:1 avec User (client)
- N:1 avec Professional
- N:1 avec Session (optionnelle)

---

### 7. **Orders** (`Order.js`)
Commandes de produits.

**Champs principaux :**
- `clientId`: Référence vers User
- `productId`: Référence vers Product
- `quantity`: Quantité commandée
- `size`: Taille sélectionnée
- `deliveryInfo`: Informations de livraison
  - `name`: Nom du destinataire
  - `email`: Email
  - `address`: Adresse de livraison
  - `phone`: Téléphone
- `status`: "pending" | "shipped" | "delivered"

**Relations :**
- N:1 avec User (client)
- N:1 avec Product

---

### 8. **Reviews** (`Review.js`)
Avis sur produits et professionnels.

**Champs principaux :**
- `userId`: Référence vers User (auteur)
- `targetId`: ID de la cible (Product ou Professional)
- `targetType`: "Product" | "Professional"
- `rating`: Note de 1 à 5
- `comment`: Commentaire textuel

**Relations :**
- N:1 avec User
- N:1 avec Product OU Professional (polymorphique)

---

### 9. **Messages** (`Message.js`)
Système de messagerie entre utilisateurs.

**Champs principaux :**
- `senderId`: Référence vers User (expéditeur)
- `receiverId`: Référence vers User (destinataire)
- `text`: Contenu du message
- `timestamp`: Date/heure d'envoi
- `conversationId`: ID de conversation généré automatiquement
- `isRead`: Statut de lecture
- `messageType`: Type de message (text, image, booking_request, etc.)

**Relations :**
- N:1 avec User (sender)
- N:1 avec User (receiver)

---

## 🔧 Fonctionnalités Avancées

### Indexation MongoDB
Chaque modèle inclut des index optimisés pour :
- Recherches par utilisateur
- Requêtes géographiques
- Recherche textuelle
- Filtrage par statut
- Tri par date

### Middleware Mongoose
- **Pre-save hooks** : Validation, génération d'IDs, mise à jour automatique
- **Post-save hooks** : Mise à jour des ratings, notifications
- **Virtuals** : Champs calculés (fullName, timeAgo, etc.)

### Validation et Sécurité
- Validation des données stricte
- Champs requis selon le contexte
- Enum pour les statuts
- Hash des mots de passe (bcrypt)
- Soft delete pour les messages

### Polymorphisme
- **Reviews** : Peut référencer Products ou Professionals
- **Favourites** : Peut contenir Products ou Professionals
- **Messages** : Support de différents types de messages

## 📈 Métriques et Analytics
Chaque collection inclut des champs pour :
- Timestamps automatiques (`createdAt`, `updatedAt`)
- Ratings moyens calculés automatiquement
- Compteurs de vues/interactions
- Statuts de modération

## 🚀 Utilisation

```javascript
// Import centralisé
const { User, Professional, Product, Session, Booking, Order, Review, Message } = require('./models');

// Exemple de requête complexe
const professionalWithStats = await Professional.findById(id)
  .populate('userId', 'name email')
  .populate('products')
  .populate('sessions')
  .populate({
    path: 'reviews',
    populate: { path: 'userId', select: 'name' }
  });
```

Cette structure offre une base solide et évolutive pour la plateforme Holistic, avec une séparation claire des responsabilités et des relations bien définies entre les entités. 
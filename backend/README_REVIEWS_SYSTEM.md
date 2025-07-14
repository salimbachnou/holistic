# Système d'Avis - Documentation Backend

## Vue d'ensemble

Le système d'avis permet aux clients de noter et commenter les produits, événements et sessions des professionnels. Il existe deux approches dans le code :

1. **Modèle Review** : Avis individuels pour chaque contenu (produit, événement, session)
2. **Modèle OrderReview** : Avis global pour une commande entière avec sous-avis par produit

Actuellement, le frontend utilise le modèle Review pour les avis individuels.

## Routes API

### Reviews (`/api/reviews`)

#### 1. Créer un avis
```
POST /api/reviews
Headers: Authorization Bearer <token>
Body: {
  contentType: "product" | "event" | "session",
  contentId: "ID du contenu",
  rating: 1-5,
  comment: "Commentaire",
  orderId: "ID de la commande (optionnel)",
  tags: ["qualité", "service", etc.]
}
```

#### 2. Récupérer les avis d'un produit
```
GET /api/reviews/product/:productId
Response: {
  success: true,
  reviews: [...]
}
```

#### 3. Récupérer les avis d'un professionnel
```
GET /api/reviews/professional
Headers: Authorization Bearer <professionalToken>
Query params: 
  - contentType: "product" | "event" | "session"
  - status: "pending" | "approved" | "rejected"
  - page: 1
  - limit: 10
```

#### 4. Mettre à jour le statut d'un avis
```
PUT /api/reviews/:reviewId/status
Headers: Authorization Bearer <professionalToken>
Body: {
  status: "pending" | "approved" | "rejected"
}
```

#### 5. Répondre à un avis
```
PUT /api/reviews/:reviewId/response
Headers: Authorization Bearer <professionalToken>
Body: {
  response: "Réponse du professionnel"
}
```

#### 6. Statistiques des avis
```
GET /api/reviews/professional/stats
Headers: Authorization Bearer <professionalToken>
Response: {
  totalReviews: 10,
  averageRating: 4.5,
  distribution: {
    1: 0,
    2: 1,
    3: 1,
    4: 3,
    5: 5
  }
}
```

### Order Reviews (`/api/order-reviews`)

#### 1. Récupérer les avis des produits d'une commande
```
GET /api/order-reviews/products-for-order/:orderId
Headers: Authorization Bearer <token>
Response: {
  success: true,
  existingReviews: {
    "productId": {
      _id: "reviewId",
      rating: 5,
      comment: "...",
      tags: [...],
      createdAt: "...",
      forThisOrder: true,
      orderId: "...",
      message: "..." // Si avis d'une autre commande
    }
  },
  stats: {
    reviewableProductsCount: 3,
    totalProductsCount: 5,
    reviewedInThisOrderCount: 1,
    reviewedInOtherOrdersCount: 1,
    allProductsReviewed: false
  }
}
```

## Modèles de données

### Review
- **clientId**: Référence vers l'utilisateur client
- **professionalId**: Référence vers le professionnel
- **contentType**: Type de contenu ("product", "event", "session")
- **contentId**: ID du contenu noté
- **contentTitle**: Titre du contenu (pour référence)
- **rating**: Note de 1 à 5
- **comment**: Commentaire (max 1000 caractères)
- **orderId**: Commande associée (optionnel)
- **status**: Statut ("pending", "approved", "rejected")
- **professionalResponse**: Réponse du professionnel
- **respondedAt**: Date de réponse
- **tags**: Tags de catégorisation
- **images**: Images associées (optionnel)

### OrderReview (Non utilisé actuellement)
- Structure pour un avis global de commande
- Contient des sous-avis par produit
- Un seul avis par client par commande (index unique)

## Logique métier

### Création d'avis
1. Vérifier que l'utilisateur est un client
2. Vérifier que le contenu existe
3. Vérifier que l'utilisateur n'a pas déjà laissé un avis pour ce contenu
4. Si orderId fourni, vérifier que la commande appartient au client
5. Auto-approuver l'avis (actuellement)

### Gestion des avis existants
- Un client ne peut laisser qu'un seul avis par contenu
- Les avis peuvent être liés à une commande spécifique
- Le système détecte si un produit a déjà été évalué dans une autre commande

### Modération
- Les professionnels peuvent approuver/rejeter les avis
- Les professionnels peuvent répondre aux avis
- Seuls les avis approuvés sont visibles publiquement

## Sécurité

1. **Authentification requise** pour toutes les opérations
2. **Autorisation** : 
   - Clients : peuvent créer des avis et voir leurs propres avis
   - Professionnels : peuvent gérer les avis de leurs contenus
3. **Validation** des données entrantes
4. **Limites** : commentaires max 1000 caractères

## Améliorations possibles

1. **Notification** : Notifier le professionnel lors d'un nouvel avis
2. **Modération automatique** : Détecter les avis inappropriés
3. **Statistiques avancées** : Tendances, mots-clés récurrents
4. **Images** : Permettre l'upload d'images avec les avis
5. **Vérification d'achat** : Marquer les avis vérifiés
6. **Réponses multiples** : Permettre un dialogue entre client et professionnel 
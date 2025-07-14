# Système de Messages - Dashboard Professionnel

## 🎯 Objectif

Afficher les **messages récents des clients** dans le dashboard professionnel pour permettre une communication fluide et un suivi des demandes.

## 🔧 Architecture

### Backend
- **Endpoint** : Intégré dans `/api/professionals/dashboard-stats`
- **Modèle** : `Message` avec relations vers `User`
- **Filtrage** : Messages reçus par le professionnel (non supprimés)

### Frontend
- **Composant principal** : `RecentMessagesSection`
- **Composant détail** : `RecentMessageCard`
- **Affichage** : Dashboard professionnel

## 📊 Structure des Données

### Modèle Message (Backend)
```javascript
{
  senderId: ObjectId,           // Client qui envoie
  receiverId: ObjectId,         // Professionnel qui reçoit
  text: String,                 // Contenu du message
  timestamp: Date,              // Date d'envoi
  isRead: Boolean,              // Lu ou non
  messageType: String,          // Type de message
  conversationId: String,       // ID de conversation
  isDeleted: Boolean           // Supprimé ou non
}
```

### Données Dashboard (Frontend)
```javascript
{
  recentMessages: [
    {
      id: String,
      senderName: String,       // Nom complet du client
      content: String,          // Contenu tronqué (30 chars)
      timeAgo: String,          // "2h", "1j", etc.
      avatar: String,           // URL de l'avatar
      senderId: ObjectId        // ID du client
    }
  ]
}
```

## 🔍 Récupération des Messages

### Requête Backend
```javascript
// Dans dashboard-stats endpoint
const recentMessages = await Message.find({
  receiverId: req.user._id,     // Messages pour ce professionnel
  isDeleted: { $ne: true }      // Non supprimés
})
.sort({ timestamp: -1 })       // Plus récents d'abord
.limit(3)                      // Maximum 3 messages
.populate('senderId', 'firstName lastName profileImage')
.lean();
```

### Formatage des Données
```javascript
const formattedRecentMessages = recentMessages.map(message => {
  const timeDiff = Math.floor((now - new Date(message.timestamp)) / (1000 * 60));
  let timeDisplay;
  
  if (timeDiff < 60) {
    timeDisplay = `${timeDiff}m`;
  } else if (timeDiff < 1440) {
    timeDisplay = `${Math.floor(timeDiff / 60)}h`;
  } else {
    timeDisplay = `${Math.floor(timeDiff / 1440)}j`;
  }
  
  return {
    id: message._id,
    senderName: message.senderId ? 
      `${message.senderId.firstName} ${message.senderId.lastName}` : 
      'Utilisateur inconnu',
    content: message.text && message.text.length > 30 ? 
      message.text.substring(0, 30) + '...' : 
      message.text || 'Message sans contenu',
    timeAgo: timeDisplay,
    avatar: message.senderId?.profileImage || null,
    senderId: message.senderId?._id
  };
});
```

## 🎨 Interface Utilisateur

### Composant RecentMessageCard
```jsx
<div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
  {/* Avatar du client */}
  <div className="flex-shrink-0">
    {message.avatar ? (
      <img src={message.avatar} className="w-10 h-10 rounded-full" />
    ) : (
      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full">
        <span className="text-sm font-semibold text-white">
          {message.senderName.charAt(0).toUpperCase()}
        </span>
      </div>
    )}
  </div>
  
  {/* Contenu du message */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between mb-1">
      <p className="font-medium text-gray-900 text-sm">
        {message.senderName}
      </p>
      <span className="text-xs text-gray-500">{message.timeAgo}</span>
    </div>
    <p className="text-sm text-gray-600 line-clamp-2">
      {message.content}
    </p>
  </div>
</div>
```

### États d'Affichage

#### Avec Messages
- **Liste** : 3 messages récents maximum
- **Avatar** : Photo de profil ou initiale
- **Nom** : Prénom + Nom du client
- **Contenu** : Message tronqué à 30 caractères
- **Heure** : Format relatif (2h, 1j, etc.)

#### Sans Messages
```jsx
<div className="text-center py-12 text-gray-500">
  <ChatBubbleLeftRightIcon className="h-8 w-8 mx-auto mb-4" />
  <h3 className="text-sm font-medium text-gray-900 mb-2">
    Aucun message récent
  </h3>
  <p className="text-xs text-gray-500">
    Les messages de vos clients apparaîtront ici
  </p>
</div>
```

## 🔗 Navigation

### Liens Disponibles
1. **"Voir tout"** → `/professional/messages` (liste complète)
2. **Click sur message** → Conversation avec le client
3. **Bouton "Répondre"** → Interface de réponse rapide

### Gestion des Clics
```javascript
const handleMessageClick = (message) => {
  // Navigation vers la conversation complète
  navigate(`/professional/messages/${message.senderId}`);
};
```

## 🛠️ Script de Test

### Création de Messages de Démonstration
```bash
# Exécuter le script de test
cd backend
node scripts/createTestMessages.js
```

Le script crée automatiquement :
- **2-4 messages** par professionnel
- **Messages réalistes** (réservations, questions, remerciements)
- **Timestamps variés** (derniers 7 jours)
- **Statuts de lecture** aléatoires

### Messages Types Générés
```javascript
const sampleMessages = [
  "Bonjour, j'aimerais réserver une session de yoga pour demain.",
  "Merci pour la séance d'hier, c'était fantastique ! À bientôt 😊",
  "Est-ce que vous proposez des cours pour débutants ?",
  "Pouvez-vous me dire le prix de vos produits de bien-être ?",
  "J'ai une question sur les horaires de vos sessions du weekend."
];
```

## 🔄 Mise à Jour Temps Réel

### Actuellement
- **Mise à jour** : À chaque rechargement du dashboard
- **Limite** : 3 messages récents
- **Tri** : Par timestamp décroissant

### Améliorations Futures
```javascript
// WebSocket pour temps réel
socket.on('new-message', (message) => {
  updateRecentMessages(message);
});

// Notifications push
if (message.receiverId === currentProfessional.id) {
  showNotification(`Nouveau message de ${message.senderName}`);
}
```

## 🎯 Fonctionnalités Avancées

### Indicateurs Visuels
- **Point rouge** : Message non lu
- **Border hover** : Survol avec couleur primaire
- **Avatar dynamique** : Photo ou initiale colorée

### Actions Rapides
```jsx
<div className="flex items-center justify-between mt-2">
  <div className="flex items-center text-xs text-gray-400">
    <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
    <span>Message</span>
  </div>
  
  <button className="text-xs text-primary-600 hover:text-primary-700">
    Répondre
  </button>
</div>
```

### Responsive Design
- **Mobile** : Stack vertical, avatars plus petits
- **Desktop** : Layout horizontal optimisé
- **Tablette** : Adaptation automatique

## 🐛 Gestion d'Erreurs

### Cas d'Erreur
1. **Sender supprimé** : "Utilisateur inconnu"
2. **Message vide** : "Message sans contenu"
3. **Avatar manquant** : Initiale avec gradient
4. **Timestamp invalide** : "Il y a longtemps"

### Fallbacks
```javascript
// Nom de l'expéditeur
const senderName = message.senderId ? 
  `${message.senderId.firstName} ${message.senderId.lastName}` : 
  'Utilisateur inconnu';

// Contenu du message
const content = message.text && message.text.length > 30 ? 
  message.text.substring(0, 30) + '...' : 
  message.text || 'Message sans contenu';
```

## 📈 Métriques

### Données Trackées
- **Nombre de messages** reçus par période
- **Taux de réponse** du professionnel
- **Temps de réponse** moyen
- **Clients les plus actifs**

### Analytics Possibles
```javascript
// Exemple de métriques
{
  totalMessages: 45,
  unreadMessages: 3,
  averageResponseTime: '2h 30m',
  mostActiveClients: [
    { name: 'Sarah M.', messageCount: 8 },
    { name: 'Ahmed K.', messageCount: 6 }
  ]
}
```

## 🔐 Sécurité

### Contrôles d'Accès
- **Authentification** : JWT requis
- **Autorisation** : Role professionnel
- **Filtrage** : Seulement messages reçus
- **Validation** : Données sanitisées

### Protection des Données
- **Troncature** : Contenu limité à 30 chars
- **Anonymisation** : Pas d'emails exposés
- **Soft delete** : Messages marqués supprimés

---

*Système de messages intégré - Dashboard Professionnel Holistic* 
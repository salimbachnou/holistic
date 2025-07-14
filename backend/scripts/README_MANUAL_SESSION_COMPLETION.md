# Manual Session Completion Script

Ce script permet de finaliser manuellement une session et d'envoyer des notifications de demande d'avis aux participants.

## Fonctionnalités

- ✅ Finalise une session spécifique
- 📧 Envoie automatiquement des notifications aux clients participants
- 🔍 Liste les sessions d'un professionnel
- ✨ Vérifications de sécurité et de propriété
- 📊 Statistiques détaillées des notifications envoyées

## Utilisation

### 1. Lister les sessions d'un professionnel

```bash
cd backend
node scripts/manualSessionCompletion.js list <professionalUserId>
```

**Exemple :**
```bash
node scripts/manualSessionCompletion.js list 60d5ec9af682fbd12a0f9a01
```

Cette commande affiche :
- Les 20 dernières sessions du professionnel
- L'ID de chaque session
- Le statut actuel
- Le nombre de participants
- Si la session peut être finalisée

### 2. Finaliser une session et envoyer les notifications

```bash
cd backend
node scripts/manualSessionCompletion.js complete <sessionId> <professionalUserId>
```

**Exemple :**
```bash
node scripts/manualSessionCompletion.js complete 60d5ec9af682fbd12a0f9a10 60d5ec9af682fbd12a0f9a01
```

Cette commande :
1. Vérifie que la session existe
2. Vérifie que le professionnel est le propriétaire
3. Marque la session comme "completed"
4. Trouve tous les participants avec des réservations confirmées
5. Envoie une notification à chaque participant
6. Affiche un rapport détaillé

## Workflow complet

### Étape 1 : Identifier la session
```bash
# Lister les sessions du professionnel
node scripts/manualSessionCompletion.js list 60d5ec9af682fbd12a0f9a01
```

### Étape 2 : Finaliser la session
```bash
# Utiliser l'ID de la session trouvée à l'étape 1
node scripts/manualSessionCompletion.js complete 60d5ec9af682fbd12a0f9a10 60d5ec9af682fbd12a0f9a01
```

### Étape 3 : Vérifier les notifications
Les clients recevront automatiquement :
- Une notification dans leur espace client
- Un lien direct vers la page de review : `/sessions/{sessionId}/review`

## Exemple de sortie

```
=== MANUAL SESSION COMPLETION SCRIPT ===
Starting at: 2024-01-15T10:30:00.000Z
Session ID: 60d5ec9af682fbd12a0f9a10
Professional User ID: 60d5ec9af682fbd12a0f9a01

✅ Session found: {
  id: 60d5ec9af682fbd12a0f9a10,
  title: "Séance de coaching personnel",
  status: "scheduled",
  startTime: 2024-01-14T15:00:00.000Z,
  professional: "Cabinet Wellness"
}

✅ Professional found: {
  id: 60d5ec9af682fbd12a0f9a02,
  businessName: "Cabinet Wellness",
  user: "Dr. Marie Dupont"
}

✅ Professional ownership verified

🔄 Completing session and sending review requests...

=== COMPLETION RESULTS ===
✅ Success: true
📝 Message: Session completed and review requests sent
👥 Total participants: 3
📧 Review requests sent: 3

📋 Review requests details:
  1. Jean Martin
     - Client ID: 60d5ec9af682fbd12a0f9a03
     - Booking ID: 60d5ec9af682fbd12a0f9a20
     - Status: sent
  2. Sophie Leclerc
     - Client ID: 60d5ec9af682fbd12a0f9a04
     - Booking ID: 60d5ec9af682fbd12a0f9a21
     - Status: sent
  3. Ahmed Benali
     - Client ID: 60d5ec9af682fbd12a0f9a05
     - Booking ID: 60d5ec9af682fbd12a0f9a22
     - Status: sent

=== FINAL STATISTICS ===
✅ Successful review requests: 3
❌ Failed review requests: 0
📊 Success rate: 100%

🎉 Session completed successfully and review notifications sent to clients!
💡 Clients will receive notifications asking them to review the session.
🔗 They can access the review page at: /sessions/60d5ec9af682fbd12a0f9a10/review
```

## Notifications envoyées aux clients

Chaque client participant recevra une notification avec :
- **Titre :** "Votre session est terminée !"
- **Message :** "Comment s'est passée votre session '[Titre]' du [Date] ? Partagez votre expérience avec d'autres clients."
- **Type :** `session_review_request`
- **Lien :** `/sessions/{sessionId}/review`
- **Données :** ID de session, titre, date, nom du professionnel, etc.

## Vérifications de sécurité

Le script effectue plusieurs vérifications :
- ✅ La session existe
- ✅ Le professionnel existe
- ✅ Le professionnel est bien le propriétaire de la session
- ✅ Seules les réservations confirmées sont traitées
- ✅ Évite les doublons de notifications

## Gestion d'erreurs

Le script gère les erreurs courantes :
- Session non trouvée
- Professionnel non trouvé
- Accès refusé (session ne appartient pas au professionnel)
- Erreurs de base de données
- Erreurs d'envoi de notifications

## Intégration avec le système existant

Ce script utilise :
- `SessionReviewService.completeSession()` : Service principal de finalisation
- `NotificationService.notifySessionReviewRequest()` : Service de notification
- Modèles existants : Session, Professional, Booking, User
- Système de notifications existant avec Socket.io

## Utilisation en production

Pour utiliser ce script en production :

1. Assurez-vous que la variable d'environnement `MONGODB_URI` est correctement configurée
2. Exécutez le script depuis le dossier `backend`
3. Vérifiez les logs pour confirmer le succès des opérations
4. Surveillez les notifications dans l'interface client

## Automatisation

Ce script peut être intégré dans :
- Un cron job pour finaliser automatiquement les sessions expirées
- Une interface d'administration pour finalisation manuelle
- Un webhook ou API pour intégration avec des systèmes externes 
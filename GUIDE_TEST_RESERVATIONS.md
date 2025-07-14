# Guide de Test - Réservations

## 🎯 Problème à Résoudre

Quand un client fait une réservation, elle n'apparaît pas immédiatement dans les "Demandes de réservation" du professionnel.

## 🔍 Étapes de Diagnostic

### 1. Vérifier les Logs Backend

```bash
# Démarrer le serveur backend avec les logs détaillés
cd backend
npm start

# Dans un autre terminal, surveiller les logs
tail -f logs/server.log
```

### 2. Test Manuel - Côté Client

1. **Ouvrir la page des sessions disponibles** :
   - Aller sur `/sessions` ou `/client-sessions`
   - Onglet "Sessions disponibles"

2. **Faire une réservation** :
   - Cliquer sur "Réserver" pour une session
   - Vérifier les logs dans la console du navigateur (F12)

3. **Vérifier la réponse** :
   - La réservation doit retourner un succès
   - Vérifier les logs backend pour les erreurs

### 3. Test Manuel - Côté Professionnel

1. **Ouvrir la page des sessions professionnelles** :
   - Aller sur `/professional/sessions`
   - Sélectionner une session

2. **Vérifier les demandes de réservation** :
   - Cliquer sur une session pour voir les détails
   - Vérifier l'onglet "Demandes de réservation"

3. **Tester le rafraîchissement automatique** :
   - Attendre 30 secondes pour le rafraîchissement automatique
   - Ou cliquer sur "Actualiser" manuellement

### 4. Test Automatique

```bash
# Exécuter le script de test complet
cd backend
node scripts/testBookingFlow.js
```

### 5. Vérification des Données

```bash
# Se connecter à MongoDB
mongosh

# Vérifier les réservations
use holistic
db.bookings.find().sort({createdAt: -1}).limit(5)

# Vérifier les sessions
db.sessions.find().sort({createdAt: -1}).limit(5)

# Vérifier les notifications
db.notifications.find().sort({createdAt: -1}).limit(5)
```

## 🐛 Points de Vérification

### 1. Structure des Données

**Session** :
```javascript
{
  _id: ObjectId,
  professionalId: ObjectId, // Doit correspondre au professionnel
  title: String,
  status: 'scheduled',
  participants: [ObjectId], // Liste des participants
  maxParticipants: Number
}
```

**Booking** :
```javascript
{
  _id: ObjectId,
  client: ObjectId,
  professional: ObjectId,
  service: {
    sessionId: ObjectId, // Doit correspondre à la session
    name: String,
    price: { amount: Number, currency: String }
  },
  status: 'pending',
  appointmentDate: Date
}
```

### 2. Logs à Surveiller

**Côté Client** :
```
=== CLIENT BOOKING SESSION ===
Session data: {...}
Professional ID: ...
Session ID: ...
Booking response: {...}
```

**Côté Backend** :
```
=== CREATING NEW BOOKING ===
Request body: {...}
Professional found: {...}
Session found: {...}
Booking saved successfully: ...
Notification sent to professional
```

### 3. Erreurs Communes

1. **Session non trouvée** :
   - Vérifier que l'ID de session est correct
   - Vérifier que la session appartient au professionnel

2. **Session non disponible** :
   - Vérifier que la session est future
   - Vérifier que la session n'est pas pleine
   - Vérifier que le statut est 'scheduled'

3. **Réservation déjà existante** :
   - Vérifier si le client a déjà réservé cette session

4. **Problème de permissions** :
   - Vérifier que l'utilisateur est authentifié
   - Vérifier que l'utilisateur a le rôle 'client'

## 🔧 Solutions

### 1. Si les réservations ne sont pas créées

- Vérifier les logs backend pour les erreurs
- Vérifier que l'API `/api/bookings` fonctionne
- Vérifier que les données envoyées sont correctes

### 2. Si les réservations sont créées mais n'apparaissent pas

- Vérifier que la requête `/api/sessions/:id/bookings` fonctionne
- Vérifier que le `sessionId` dans le booking correspond à la session
- Vérifier les permissions du professionnel

### 3. Si le rafraîchissement automatique ne fonctionne pas

- Vérifier que l'auto-refresh est activé
- Vérifier les logs de la fonction `fetchSessionBookings`
- Vérifier que le modal est ouvert

## 📊 Indicateurs de Succès

✅ **Réservation créée** :
- Message "Session réservée avec succès !"
- Réservation visible dans `/client-sessions` > "Mes réservations"

✅ **Notification envoyée** :
- Notification visible dans `/professional/sessions`
- Badge "+X nouveau(x)" dans l'en-tête

✅ **Rafraîchissement automatique** :
- Point vert animé indiquant l'auto-refresh
- Indicateur "Dernière actualisation: HH:MM:SS"

✅ **Nouvelles réservations visibles** :
- Bordure verte autour des nouvelles réservations
- Badge "NOUVELLE RÉSERVATION"
- Toast notification de confirmation

## 🚨 En Cas de Problème

1. **Vérifier les logs** dans la console du navigateur et du serveur
2. **Exécuter le script de test** : `node scripts/testBookingFlow.js`
3. **Vérifier les données** dans MongoDB
4. **Tester manuellement** le flux complet
5. **Vérifier les permissions** et l'authentification

## 📞 Support

Si le problème persiste, fournir :
- Les logs d'erreur complets
- Les données de session et de réservation
- Les étapes exactes reproduites
- Le résultat du script de test 
# Système d'Avis pour les Sessions

## Vue d'ensemble

Ce système permet aux participants de laisser des avis sur les sessions auxquelles ils ont participé, et automatise le processus de demande d'avis une fois les sessions terminées.

## Fonctionnalités

### 1. Finalisation automatique des sessions

- **Bouton "Terminer"** : Les professionnels peuvent marquer manuellement leurs sessions comme terminées
- **Finalisation automatique** : Script automatique qui finalise les sessions expirées
- **Notifications d'avis** : Envoi automatique de demandes d'avis à tous les participants

### 2. Système d'avis complet

- **Avis détaillés** : Note globale + aspects spécifiques (contenu, communication, professionnalisme, rapport qualité-prix)
- **Commentaires** : Avis textuels détaillés avec validation
- **Recommandations** : Option "Je recommande / Je ne recommande pas"
- **Vérification** : Seuls les participants confirmés peuvent laisser des avis

### 3. Notifications intelligentes

- **Demandes d'avis** : Notifications automatiques après finalisation des sessions
- **Rappels** : Système de rappels pour les avis en attente
- **Notifications professionnels** : Alerte lors de nouveaux avis reçus

## Architecture technique

### Backend

#### Services

1. **SessionReviewService** (`backend/services/sessionReviewService.js`)
   - `completeSession()` : Finalise une session et envoie les demandes d'avis
   - `autoCompleteExpiredSessions()` : Finalise automatiquement les sessions expirées
   - `getReviewStats()` : Statistiques des avis pour un professionnel
   - `sendReviewReminders()` : Envoie des rappels d'avis

2. **NotificationService** (étendu)
   - `notifySessionReviewRequest()` : Demande d'avis après session
   - `notifySessionReviewReminder()` : Rappel d'avis
   - `notifyProfessionalNewReview()` : Notification de nouvel avis

#### Routes API

1. **Sessions** (`/api/sessions`)
   - `PUT /:id/complete` : Finaliser une session
   - `GET /review-stats` : Statistiques des avis
   - `POST /send-review-reminders` : Envoyer des rappels
   - `POST /auto-complete-expired` : Finalisation automatique (admin)

2. **Avis** (`/api/reviews`)
   - `POST /session` : Créer un avis de session
   - `GET /session/:sessionId/user` : Avis de l'utilisateur pour une session
   - `GET /session/:sessionId` : Tous les avis d'une session
   - `PUT /:reviewId` : Modifier un avis

#### Scripts

1. **autoCompleteExpiredSessions.js**
   - Script automatique pour finaliser les sessions expirées
   - Peut être exécuté via cron job ou manuellement
   - Commande : `npm run auto-complete-sessions`

### Frontend

#### Pages

1. **SessionReviewPage** (`/sessions/:sessionId/review`)
   - Interface de création/modification d'avis
   - Validation des données
   - Vérification de participation

2. **ProfessionalSessionsPage** (étendue)
   - Bouton "Terminer" pour les sessions programmées
   - Statistiques des avis
   - Gestion des demandes d'avis

#### Composants

- **Système d'étoiles** : Notation interactive
- **Validation de formulaires** : Contrôles côté client
- **Notifications** : Feedback utilisateur en temps réel

## Utilisation

### Pour les professionnels

1. **Finaliser une session** :
   ```javascript
   // Via l'interface
   // Cliquer sur "Terminer" dans les détails de la session
   
   // Via API
   PUT /api/sessions/:sessionId/complete
   ```

2. **Consulter les statistiques** :
   ```javascript
   GET /api/sessions/review-stats
   ```

3. **Envoyer des rappels** :
   ```javascript
   POST /api/sessions/send-review-reminders
   ```

### Pour les clients

1. **Laisser un avis** :
   - Accéder via notification ou lien direct
   - URL : `/sessions/:sessionId/review`
   - Remplir le formulaire avec note et commentaire

2. **Modifier un avis** :
   - Retourner sur la même page
   - L'avis existant sera pré-rempli

### Pour les administrateurs

1. **Finalisation automatique** :
   ```bash
   # Exécution manuelle
   npm run auto-complete-sessions
   
   # Via cron job (recommandé)
   0 */6 * * * cd /path/to/backend && npm run auto-complete-sessions
   ```

2. **Via API** :
   ```javascript
   POST /api/sessions/auto-complete-expired
   ```

## Configuration

### Variables d'environnement

```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/holistic-platform

# Notifications (optionnel)
EMAIL_SERVICE_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Cron Job (recommandé)

```bash
# Ajouter au crontab pour exécution automatique toutes les 6 heures
0 */6 * * * cd /path/to/backend && npm run auto-complete-sessions >> /var/log/session-reviews.log 2>&1
```

## Flux de données

### 1. Finalisation de session

```
Session programmée → Terminée → Recherche participants → Envoi notifications → Demandes d'avis
```

### 2. Création d'avis

```
Notification → Page d'avis → Validation participation → Création avis → Notification professionnel
```

### 3. Finalisation automatique

```
Script cron → Recherche sessions expirées → Finalisation → Envoi demandes d'avis
```

## Validation et sécurité

### Côté backend

- **Vérification de participation** : Seuls les participants confirmés peuvent laisser des avis
- **Validation des données** : Contrôle des notes (1-5) et longueur des commentaires
- **Authentification** : Toutes les routes protégées par JWT
- **Autorisation** : Vérification des rôles et permissions

### Côté frontend

- **Validation en temps réel** : Feedback immédiat sur les erreurs
- **Contrôles d'accès** : Redirection si pas de participation
- **Gestion d'erreurs** : Messages d'erreur explicites

## Monitoring et logs

### Logs disponibles

- **Création d'avis** : Détails des avis créés
- **Finalisation de sessions** : Sessions terminées et participants notifiés
- **Erreurs** : Problèmes de validation ou techniques
- **Notifications** : Envois de notifications et rappels

### Métriques

- **Taux d'avis** : Pourcentage de participants laissant des avis
- **Notes moyennes** : Évolution des notes par professionnel
- **Temps de réponse** : Délai entre fin de session et avis

## Évolutions futures

### Fonctionnalités prévues

1. **Avis anonymes** : Option d'avis anonyme
2. **Modération** : Système de modération des avis
3. **Réponses professionnels** : Réponses aux avis
4. **Badges** : Système de badges basé sur les avis
5. **Analyse sentiment** : Analyse automatique des commentaires

### Améliorations techniques

1. **Cache** : Mise en cache des statistiques
2. **Indexation** : Optimisation des requêtes MongoDB
3. **API GraphQL** : Alternative à REST pour les avis
4. **Webhooks** : Notifications externes
5. **Export** : Export des avis en PDF/CSV

## Support et maintenance

### Commandes utiles

```bash
# Test du système
npm run test

# Finalisation manuelle
npm run auto-complete-sessions

# Vérification des logs
tail -f /var/log/session-reviews.log

# Backup des avis
mongodump --collection reviews --db holistic-platform
```

### Dépannage

1. **Sessions non finalisées** : Vérifier les logs du script automatique
2. **Notifications non envoyées** : Vérifier la configuration SMTP
3. **Avis non créés** : Vérifier la participation de l'utilisateur
4. **Erreurs de validation** : Consulter les logs backend

## Conclusion

Ce système d'avis pour les sessions améliore significativement l'expérience utilisateur en automatisant le processus de feedback et en fournissant des outils complets pour la gestion des avis. Il respecte les bonnes pratiques de sécurité et de performance tout en offrant une interface intuitive pour tous les utilisateurs. 
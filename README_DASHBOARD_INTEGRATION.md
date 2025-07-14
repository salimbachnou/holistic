# Dashboard Professionnel - Intégration Backend

Ce document explique comment les statistiques du dashboard professionnel sont maintenant connectées avec le backend.

## 🔧 Architecture

### Backend (API)
- **Endpoint**: `/api/professionals/dashboard-stats`
- **Méthode**: GET
- **Authentification**: JWT Bearer Token
- **Middleware**: `isAuthenticated`, `isProfessional`

### Frontend (React)
- **Service**: `ProfessionalService`
- **Composant**: `ProfessionalDashboardPage`
- **Gestion d'erreurs**: Fallback vers données de démonstration

## 📊 Statistiques Disponibles

### 1. Sessions
- **Total du mois courant**: Nombre de sessions créées ce mois
- **Tendance**: Comparaison avec le mois précédent
- **Source**: Collection `sessions`

### 2. Nouveaux Clients
- **Total**: Clients uniques ayant réservé ce mois
- **Tendance**: Évolution par rapport au mois précédent
- **Source**: Collection `bookings`

### 3. Revenus
- **Total**: Revenus combinés des réservations et sessions
- **Tendance**: Comparaison mensuelle
- **Sources**: Collections `bookings` et `sessions`

### 4. Note Moyenne
- **Valeur**: Note moyenne du professionnel
- **Source**: Champ `rating.average` dans `professionals`

### 5. Prochaines Sessions
- **Limite**: 3 prochaines sessions
- **Tri**: Par date de début
- **Source**: Collection `sessions`

### 6. Messages Récents
- **Limite**: 3 derniers messages
- **Tri**: Par timestamp
- **Source**: Collection `messages`

## 🛠️ Utilisation

### Côté Backend

```javascript
// L'endpoint est automatiquement disponible
GET /api/professionals/dashboard-stats
Headers: {
  Authorization: "Bearer YOUR_JWT_TOKEN"
}
```

### Côté Frontend

```javascript
import ProfessionalService from '../services/professionalService';

// Récupérer les statistiques
const result = await ProfessionalService.getDashboardStats();

if (result.success) {
  console.log(result.data.stats);
} else {
  console.error(result.error);
}
```

## 🔍 Débogage

### Mode Développement
Un composant de débogage est disponible en mode développement :
- Affiche les données brutes de l'API
- Permet de tester la connexion
- Montre les erreurs détaillées

### Logs Backend
```bash
# Démarrer le serveur avec logs détaillés
cd backend
npm start

# Les logs incluent :
# - Erreurs de connexion à la base de données
# - Requêtes MongoDB
# - Erreurs d'authentification
```

## 🚨 Gestion d'Erreurs

### Erreurs Communes

1. **Profil professionnel non trouvé**
   - Vérifier que l'utilisateur a un profil professionnel
   - Vérifier l'ID utilisateur dans le token JWT

2. **Données manquantes**
   - Le système utilise des valeurs par défaut (0, [], etc.)
   - Aucune erreur n'est générée pour les collections vides

3. **Erreur de connexion API**
   - Fallback automatique vers des données de démonstration
   - Toast d'erreur informatif pour l'utilisateur

### Stratégie de Fallback

```javascript
// En cas d'erreur, affichage de données par défaut
const mockStats = {
  sessions: { total: 0, trend: 'up', trendValue: '+0%' },
  clients: { total: 0, trend: 'up', trendValue: '+0' },
  revenue: { total: '0', trend: 'up', trendValue: '+0%' },
  rating: { total: '0.0', trend: 'up', trendValue: '+0.0' },
  upcomingSessions: [],
  recentMessages: []
};
```

## 🔄 Actualisation

### Automatique
- Les données sont chargées au montage du composant
- Pas de rechargement automatique (à implémenter si nécessaire)

### Manuelle
- Bouton "Actualiser" dans l'interface
- Raccourci clavier possible (à implémenter)

## 📈 Améliorations Futures

### Données Temps Réel
- WebSocket pour les mises à jour en temps réel
- Notifications push pour les nouveaux messages
- Actualisation automatique des statistiques

### Statistiques Avancées
- Graphiques de tendance
- Comparaisons sur plusieurs mois
- Prédictions basées sur l'historique

### Performance
- Cache des données côté client
- Pagination pour les grandes listes
- Optimisation des requêtes MongoDB

## 🔐 Sécurité

### Authentification
- JWT obligatoire pour tous les endpoints
- Vérification du rôle professionnel
- Validation des permissions

### Données Sensibles
- Pas d'exposition d'informations clients sensibles
- Anonymisation des données dans les logs
- Respect du RGPD

## 📝 Tests

### Tests Unitaires
```bash
# Backend
cd backend
npm test

# Frontend  
cd frontend
npm test
```

### Tests d'Intégration
```bash
# Test de l'endpoint complet
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://hamza-aourass.ddns.net:5001/api/professionals/dashboard-stats
```

## 🐛 Problèmes Connus

1. **Calcul des tendances**
   - Les pourcentages peuvent être imprécis pour de petites valeurs
   - Pas de gestion des divisions par zéro (corrigé)

2. **Format des dates**
   - Dépendant du fuseau horaire du serveur
   - À standardiser en UTC

3. **Performance**
   - Requêtes multiples non optimisées
   - Possibilité d'utiliser des agrégations MongoDB

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs du serveur
2. Utiliser le composant de débogage en développement
3. Contacter l'équipe de développement

---

*Dernière mise à jour : [Date actuelle]* 
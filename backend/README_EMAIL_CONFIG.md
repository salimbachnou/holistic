# Configuration Email - Holistic Backend

## Problème actuel
Les réservations fonctionnent correctement, mais les emails de confirmation ne sont pas envoyés à cause d'une erreur d'authentification SMTP.

## Solution
Le service email a été modifié pour être optionnel. Si les identifiants email ne sont pas configurés, les réservations continueront à fonctionner normalement sans envoi d'email.

## Configuration Gmail (Optionnelle)

Pour activer l'envoi d'emails, créez un fichier `.env` dans le dossier `backend/` avec les variables suivantes :

```env
# Email Configuration (Gmail)
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_application

# Autres variables nécessaires
MONGODB_URI=mongodb://localhost:27017/holistic
JWT_SECRET=votre_clé_secrète_jwt
FRONTEND_URL=http://localhost:3000
PORT=5000
NODE_ENV=development
```

### Étapes pour configurer Gmail :

1. **Activer l'authentification à deux facteurs** sur votre compte Gmail
2. **Générer un mot de passe d'application** :
   - Allez dans les paramètres de sécurité Google
   - Sélectionnez "Mots de passe d'application"
   - Choisissez "Autre" et nommez-le "Holistic Backend"
   - Copiez le mot de passe généré (16 caractères)
3. **Utiliser ce mot de passe d'application** comme `EMAIL_PASS` (pas votre mot de passe Gmail normal)

### Alternative : Utiliser un autre service email

Si vous préférez utiliser un autre service email que Gmail, modifiez la configuration dans `services/emailService.js` :

```javascript
// Pour Outlook/Hotmail
service: 'hotmail'

// Pour Yahoo
service: 'yahoo'

// Pour un serveur SMTP personnalisé
host: 'smtp.votre-serveur.com',
port: 587,
secure: false, // true pour port 465, false pour autres ports
```

## Statut actuel

✅ **Les réservations fonctionnent normalement**
⚠️ **Les emails sont désactivés** (pas d'erreur, juste pas d'envoi)
✅ **Les notifications in-app fonctionnent**

## Test

Pour tester si les emails fonctionnent après configuration :
1. Créez le fichier `.env` avec vos identifiants
2. Redémarrez le serveur backend
3. Faites une réservation
4. Vérifiez les logs du serveur pour voir si les emails sont envoyés

## Logs

Les messages suivants apparaîtront dans les logs :
- `Email service not configured. Skipping...` → Configuration manquante (normal)
- `Email sent to client: email@example.com` → Email envoyé avec succès
- `Error sending email: ...` → Erreur d'envoi (vérifiez la configuration) 
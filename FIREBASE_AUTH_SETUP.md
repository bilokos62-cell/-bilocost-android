# Activation de Firebase Authentication pour Bilocost

Le code de l'application utilise Firebase Authentication avec :
- E-mail + mot de passe (création de compte, connexion, réinitialisation).
- E-mail de vérification après inscription.
- Session persistante dans le navigateur Android / Capacitor.
- Connexion Google et Facebook disponibles dans l'interface, à activer séparément.

## Action nécessaire dans Firebase Console

1. Ouvrir le projet **bilocost-a8136** : https://console.firebase.google.com/project/bilocost-a8136/authentication
2. Ouvrir **Authentication > Sign-in method**.
3. Activer **Email/Password** (pas seulement Email link), puis enregistrer.
4. Dans **Authentication > Settings > Authorized domains**, vérifier que les domaines d'hébergement Bilocost sont autorisés. Ajouter le domaine exact de l'application si absent.
5. Dans **Authentication > Templates**, vérifier le modèle **Email address verification** et le modèle **Password reset** (langue française si disponible).
6. Créer un compte de test avec une adresse e-mail réelle, ouvrir le lien de vérification reçu, puis tester la déconnexion et la reconnexion.

## Google / Facebook

Ils ne doivent être activés qu'après configuration de leurs identifiants OAuth dans leurs consoles respectives et ajout des domaines/URI de redirection demandés par Firebase. Le bouton Telegram reste non connecté : il nécessite une vérification serveur du jeton Telegram.

## Important

Ne jamais mettre de clé privée de compte de service, mot de passe ou jeton OAuth dans `index.html`. La configuration Firebase Web (apiKey, projectId, appId) est publique par conception ; les règles Firestore et Storage doivent protéger les données.

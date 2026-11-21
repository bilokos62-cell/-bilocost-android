# Accès administrateur Bilocost

## URL
Après déploiement de Firebase Hosting, ouvrir :
https://bilocost-drc-2026.web.app/admin/

## Connexion
1. Créer au préalable un utilisateur dans Firebase Authentication (méthode e-mail/mot de passe).
2. Depuis un poste de confiance connecté au projet Firebase avec les droits IAM nécessaires, attribuer le rôle à l'adresse voulue :
   ```bash
   cd functions
   npm ci
   gcloud auth application-default login
   node scripts/set-admin-claim.js admin@example.com
   ```
   Remplacer l'adresse d'exemple par celle du compte administrateur réel.
3. Se déconnecter puis se reconnecter sur /admin/.

Le script utilise Firebase Admin SDK et les identifiants ADC locaux. Il n'existe aucune fonction publique permettant à un utilisateur de s'attribuer le rôle. Ne jamais placer une clé de compte de service dans le dépôt, le navigateur ou un formulaire.

## Contrôle d'accès actuel
- La page demande une authentification Firebase.
- Elle renouvelle le jeton puis vérifie le custom claim `admin: true`.
- Un compte sans ce claim est déconnecté et ne voit pas l'espace protégé.
- Les fonctions sensibles existantes vérifient également le claim côté serveur.
- Cette première livraison est une porte d'accès sécurisée, pas encore un tableau de bord métier : aucune liste d'utilisateurs, commande ou donnée privée n'est exposée dans cette page.

## Limites et étapes avant mise en production
- Déployer Hosting après revue/merge de la PR.
- Vérifier que Firebase Authentication Email/Password est activé et que le domaine Hosting est autorisé.
- Attribuer le rôle uniquement à l'adresse contrôlée par le propriétaire du projet.
- Configurer une authentification multifacteur si le projet Firebase/Identity Platform le permet.
- Construire les modules métier du tableau de bord avec des fonctions serveur dédiées et journalisées.
- La présence de cette page ne signifie pas qu'elle est déjà publiée en production.

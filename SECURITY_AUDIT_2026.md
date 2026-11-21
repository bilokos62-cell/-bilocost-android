# Bilocost — audit de sécurité et plan de durcissement

Date de revue : 21 novembre 2026
Périmètre : dépôt GitHub, règles Firebase et workflows consultés.
Statut : revue du code source uniquement. Aucun accès à la console Firebase de production ni test d'intrusion réseau n'a été effectué.

## Mesures déjà présentes dans le dépôt

- Firestore utilise une règle de refus par défaut pour les collections non explicitement autorisées.
- Storage utilise une règle de refus par défaut.
- Les profils utilisateurs sont privés et lisibles par leur propriétaire ou un administrateur.
- Les justificatifs d'identité sont dans le chemin privé `private_identity/{uid}`.
- Les opérations de commande, codes de remise et notifications sont conçues pour être écrites côté serveur.
- Les opérations administratives des Cloud Functions vérifient le custom claim Firebase `admin: true`.
- Le workflow Hosting déploie les règles Firestore et Storage avec le site.

## Constats à traiter

### Critique avant ouverture publique de l'administration

1. **Aucune procédure d'attribution du premier superadministrateur n'a été identifiée dans les fichiers examinés.** Il faut créer le rôle depuis un environnement de confiance, avec Firebase Admin SDK, après validation de l'identité du titulaire. Ne jamais exposer une fonction publique de promotion.
2. **Le déploiement des Cloud Functions est séparé du déploiement Hosting.** Le workflow Hosting exclut explicitement les Functions. Vérifier le workflow Functions et l'état réellement déployé avant d'utiliser une fonction d'administration.
3. **L'état réel de Firebase App Check n'est pas vérifiable depuis le dépôt.** Enregistrer les applications Web/Android/iOS, intégrer les fournisseurs d'attestation appropriés, observer les métriques puis activer l'application des contrôles service par service sans bloquer les versions légitimes.
4. **Les règles Firestore/Storage doivent être testées avec Firebase Emulator Suite.** Le script de validation actuel est principalement statique et ne démontre pas le comportement effectif des règles.

### Élevé

5. Les règles Storage rendent les photos des annonces de location et des événements publiquement lisibles. Confirmer que ces médias sont destinés à être publics et qu'aucun document d'identité ne peut être placé dans ces chemins.
6. Le blocage des numéros de téléphone dans les messages est principalement effectué dans l'interface. Le contrôle doit aussi être appliqué côté serveur avant l'écriture du message.
7. Le suivi fiable des sessions, les alertes de connexion et le journal des actions administratives ne sont pas établis par les fichiers consultés.
8. Le preset Cloudinary non signé est un point d'abus potentiel : limiter formats, taille, transformations et quotas dans Cloudinary ; envisager des uploads signés côté serveur.
9. L'analyse du code courant ne couvre pas l'historique Git complet, les secrets GitHub, les règles IAM, les paramètres Authentication, les journaux Cloud Audit ni les configurations Cloudinary.

## Architecture cible de l'administration

- Compte d'administration distinct du compte marchand/utilisateur.
- Authentification forte (MFA) et adresse de récupération protégée.
- Custom claim `admin: true` attribué exclusivement par un opérateur de confiance via Admin SDK.
- Vérification des autorisations dans chaque Cloud Function et dans les règles Firebase ; l'interface seule ne constitue jamais une barrière de sécurité.
- Rôles à privilèges minimaux : superadmin, administrateur opérationnel, modérateur.
- Journal append-only des opérations administratives : acteur, action, cible, horodatage, résultat ; aucune donnée secrète ni pièce d'identité dans les journaux.
- Révocation des sessions et procédure de réponse à incident.
- Ne jamais autoriser l'auto-attribution de rôle, ni faire confiance à un champ `role` stocké dans un profil client.

## Plan d'exécution ordonné

1. Tester les règles Firestore et Storage avec Emulator Suite, y compris les tentatives inter-comptes et les accès anonymes.
2. Vérifier les paramètres Firebase Authentication, MFA, domaines autorisés, fournisseurs activés et quotas anti-abus.
3. Enregistrer et intégrer App Check pour Web, Android et iOS ; vérifier les métriques avant enforcement.
4. Auditer les Cloud Functions sensibles, les contrôles de rôles, les entrées, les limites de débit et les journaux.
5. Déplacer la modération des messages et toute décision métier sensible côté serveur.
6. Sécuriser les médias et les justificatifs d'identité, puis vérifier les règles effectives en production.
7. Activer les protections GitHub : protection de branche, revue obligatoire, moindre privilège des secrets et permissions minimales des workflows.
8. Configurer alertes de budget, quotas, sauvegardes et tests de restauration.
9. Faire un test d'intrusion autorisé et corriger les constats avant ouverture publique.

## Limites et sécurité de déploiement

Cette branche ne déploie rien sur Firebase et ne modifie pas les règles de production. Les contrôles App Check, MFA, IAM, GitHub Secrets et les sauvegardes nécessitent une vérification dans les consoles correspondantes. Ne pas activer App Check en mode enforcement avant d'avoir confirmé que toutes les versions client légitimes envoient des jetons valides.

## Références officielles

- Firebase Security Checklist : https://firebase.google.com/support/guides/security-checklist
- Firebase App Check : https://firebase.google.com/docs/app-check
- App Check enforcement : https://firebase.google.com/docs/app-check/enable-enforcement
- Firebase custom claims : https://firebase.google.com/docs/auth/admin/custom-claims

# Compte développeur administrateur de Bilocost

Cette procédure crée un compte de test qui possède à la fois le rôle administrateur Firebase et le statut d'identité vérifiée de test. Elle ne désactive pas les règles Firestore ou Storage pour les autres utilisateurs.

## 1. Créer le compte

1. Créer un compte dans Bilocost avec une adresse e-mail à laquelle vous avez accès.
2. Vérifier cette adresse e-mail.
3. Dans Firebase Console > Authentication > Users, copier l'UID exact de ce compte.

## 2. Autoriser uniquement cet UID

Dans le dossier `functions`, créer ou compléter le fichier d'environnement du projet :

```dotenv
BILOCOST_DEVELOPER_ADMIN_UID=COLLER_ICI_UID_FIREBASE
```

Pour le projet Firebase `bilocost-a8136`, le nom du fichier local attendu par Firebase CLI est `.env.bilocost-a8136` à la racine du dossier `functions`. Ne jamais committer ce fichier. Ajouter `.env*` au `.gitignore` si nécessaire.

## 3. Déployer et exécuter

Depuis la racine du projet, avec Firebase CLI connecté au bon compte :

```bash
firebase use bilocost-a8136
firebase deploy --only functions:provisionDeveloperAdmin
```

Connecter le compte développeur dans Bilocost, puis appeler la callable Functions `provisionDeveloperAdmin` depuis une session Firebase Auth de ce même compte. L'appel refuse tout autre UID et exige une adresse e-mail vérifiée.

## 4. Actualiser la session et contrôler

Après une réponse `ok: true`, déconnecter puis reconnecter le compte. Vérifier dans Authentication que le jeton contient le custom claim `admin: true`, et dans Firestore que `identity_verifications/{UID}` possède `status: verified` et `verificationType: developer_test`.

## Sécurité

- Ne jamais mettre de clé de compte de service dans l'application, dans le dépôt ou dans un message.
- Ne jamais définir cet UID à partir d'une donnée fournie par le client.
- La fonction ne permet pas à un utilisateur de choisir son propre UID : elle compare le compte authentifié à la valeur d'environnement configurée côté serveur.
- La certification créée est un statut de test développeur, pas une vérification légale d'identité. Ne pas l'utiliser comme preuve KYC réelle.
- Pour retirer l'accès administrateur, supprimer le custom claim `admin` via un environnement Admin SDK sécurisé, puis forcer une nouvelle connexion.

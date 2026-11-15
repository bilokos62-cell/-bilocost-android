# Bilocost — déploiement et sécurité Firebase

## Configuration déployée par GitHub Actions

Le dépôt utilise désormais :
- `firestore.rules` pour les droits d'accès aux documents ;
- `firestore.indexes.json` pour l'historique des transactions du portefeuille ;
- `storage.rules` pour les documents d'identité et les photos de location/événements ;
- `firebase.json` pour déclarer ces fichiers au CLI Firebase.

Le workflow manuel du site exécute :
`firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project bilocost-a8136`

Il publie donc ensemble le site, les règles Firestore, les index et les règles Storage. Le workflow n'est pas lancé automatiquement à chaque commit : il faut le déclencher depuis GitHub Actions après vérification du projet Firebase et du secret `FIREBASE_SERVICE_ACCOUNT_BILOCOST_A8136`.

Le workflow Android compile l'application ; il ne déploie pas les règles Firebase.

## Collections couvertes

| Collection | Accès |
|---|---|
| items | Lecture publique ; création/modification/suppression par le vendeur propriétaire |
| users | Lecture et modification du compte par son propriétaire uniquement |
| chats et messages | Participants uniquement |
| identity_verifications | Propriétaire et administrateur ; statut de vérification modifiable par administrateur |
| rentalListings | Annonces BOOKABLE publiques ; brouillons et demandes visibles par leur propriétaire |
| events | Lecture publique ; gestion par le créateur |
| services | Lecture publique des services ACTIVE ; gestion limitée du propriétaire |
| adCampaignRequests | Propriétaire et administrateur |
| ads | Lecture des publicités ACTIVE ; écriture administrateur |
| walletTransactions | Lecture par le propriétaire ; aucune écriture depuis le client |
| serials | Création par l'utilisateur propriétaire ; pas de lecture publique |
| reports et callbacks | Création par l'utilisateur ; lecture/modération administrateur |

Les collections non déclarées sont refusées par défaut.

## Rôles administrateur

Les règles sensibles utilisent le custom claim Firebase Authentication `admin: true`.
Ce claim ne doit être défini que depuis un environnement serveur de confiance avec le SDK Admin.
Ne jamais ajouter un bouton ou un champ dans l'application qui permet à un utilisateur de s'accorder ce rôle.

Pour approuver un dossier d'identité, un administrateur autorisé met le document
`identity_verifications/{uid}` à `status: "verified"`.
La publication d'une location en `PENDING_REVIEW` exige cette validation côté Firestore,
et non une simple valeur envoyée par le navigateur.

## Limites métier non activées

- Les paiements, le séquestre, les remboursements et les webhooks ne sont pas implémentés.
- Les transactions du portefeuille sont en lecture seule côté client.
- Les paiements de services et de publicité doivent être confirmés par un prestataire avant activation.
- Le blocage des numéros dans les messages est actuellement effectué dans l'interface ; une fonction serveur de modération reste nécessaire pour rendre ce contrôle résistant aux clients modifiés.
- Les photos de location et d'événements ont des URLs de téléchargement enregistrées dans les documents publics ; elles sont donc traitées comme des médias publics. Les justificatifs d'identité ne doivent jamais être partagés par URL publique.

## Protection ajoutée — annonces en attente

Les vendeurs ne peuvent pas faire passer eux-mêmes une annonce `pending` à `active`. Seul un compte administrateur de confiance (custom claim `admin: true`) peut effectuer cette modération. Cette protection est vérifiée par le script de validation du dépôt. Elle doit encore être déployée sur Firebase pour devenir effective en production.

## Clés et services tiers

- Les paramètres Firebase client et la clé de site reCAPTCHA sont des identifiants publics côté application ; ils ne remplacent jamais les règles d'accès.
- Ne jamais ajouter de clé privée, mot de passe, jeton d'accès ou clé de compte de service dans le dépôt. Les secrets de déploiement restent dans GitHub Actions Secrets.
- Le preset Cloudinary `bilocost_upload` est un preset non signé utilisé par le navigateur. Dans la console Cloudinary, limiter ce preset aux images nécessaires, aux formats autorisés et à une taille maximale ; ne pas y placer de secret. Un upload signé côté serveur est préférable lorsque l'environnement serveur est disponible.
- L'analyse du dépôt ne prouve pas l'absence de secrets dans tout l'historique Git ni l'état effectif des réglages Firebase/Cloudinary.

## Vérifications

Le script `npm run build` contrôle la syntaxe JavaScript de l'application,
la présence des intégrations principales, les chemins des règles Firebase et
l'index composé du portefeuille. La réussite d'une compilation ne remplace pas
les tests réels d'authentification, de lecture/écriture, de messagerie, de paiement
et de comportement sur Android.

# Bilocost — confidentialité et protection des fichiers

## Principe obligatoire

Bilocost ne doit jamais parcourir automatiquement les fichiers du téléphone d'un client.
L'application demande une confirmation explicite avant chaque ouverture d'un sélecteur
de fichiers. Le client choisit ensuite lui-même les fichiers autorisés. Refuser doit
laisser l'application utilisable sans lire de fichier.

Le contrôle ajouté dans `index.html` couvre les sélecteurs `pf`, `rpf`, `svf`,
`avf`, `iddoc`, `csvf`, `apf` et tout nouvel élément `input[type=file]`.
La sélection d'une photo d'annonce n'autorise pas sa réutilisation comme photo de
profil ou justificatif. Le consentement doit être redemandé pour chaque ouverture.

## Règles de traitement

- Finalité annoncée avant l'ouverture : annonce, location, profil, identité ou import CSV.
- Aucun parcours de la galerie, des téléchargements ou des dossiers en arrière-plan.
- Aucun envoi avant le choix du fichier.
- Les justificatifs d'identité ne doivent jamais être inclus dans les annonces publiques.
- Ne pas utiliser les documents à des fins publicitaires, d'entraînement ou de profilage.
- Restreindre l'accès aux justificatifs aux personnels habilités chargés de la vérification.
- Prévoir une procédure de demande de suppression et une durée de conservation définie.
- Les liens de téléchargement de justificatifs ne doivent jamais être affichés ou partagés
  dans le profil public, les annonces ou les messages.
- Une autorisation de sélection ne vaut pas autorisation de publication publique.

## Règles Firebase Storage à examiner et fusionner

Ce bloc est une base de protection pour les chemins actuellement utilisés par le code.
Il doit être vérifié contre les autres fonctionnalités avant publication. Ne remplacez
pas aveuglément les règles Storage déjà en place.

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function signedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    function isAdmin() {
      return signedIn() && request.auth.token.admin == true;
    }

    function validImage() {
      return request.resource != null
        && request.resource.size <= 8 * 1024 * 1024
        && request.resource.contentType.matches('image/(jpeg|png|webp)');
    }

    // Documents d'identité : jamais publics.
    match /private_identity/{uid}/{fileName} {
      allow read: if isOwner(uid) || isAdmin();
      allow create: if isOwner(uid)
        && request.resource.size <= 8 * 1024 * 1024
        && request.resource.contentType.matches('image/(jpeg|png|webp)|application/pdf');
      allow update: if false;
      allow delete: if isOwner(uid) || isAdmin();
    }

    // Photos d'articles : lecture publique seulement si elles sont destinées
    // à une annonce publique ; écriture limitée au propriétaire.
    match /items/{uid}/{itemId}/{fileName} {
      allow read: if true;
      allow create: if isOwner(uid) && validImage();
      allow update: if false;
      allow delete: if isOwner(uid) || isAdmin();
    }

    // Photos de location : mêmes limites que les photos d'articles.
    match /rentalListings/{uid}/{listingId}/{fileName} {
      allow read: if true;
      allow create: if isOwner(uid) && validImage();
      allow update: if false;
      allow delete: if isOwner(uid) || isAdmin();
    }

    // Tout chemin non explicitement autorisé reste privé.
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Attention : les règles Storage évaluent les droits d'accès aux fichiers. Elles ne
peuvent pas vérifier qu'un justificatif d'identité a été approuvé par un agent.
Le claim `admin` doit être attribué uniquement depuis un environnement serveur de
confiance, jamais depuis le navigateur ou l'application mobile.

## Règles Firestore pour les dossiers d'identité

À fusionner dans les règles Firestore existantes, à l'intérieur du bloc
`match /databases/{database}/documents`. Ne supprimez pas les règles des autres
collections.

```javascript
match /identity_verifications/{uid} {
  allow create: if request.auth != null
    && request.auth.uid == uid
    && request.resource.data.uid == uid
    && request.resource.data.status == "pending"
    && request.resource.data.identity.docPath.matches(
      "private_identity/" + uid + "/.*"
    );

  allow read: if request.auth != null
    && (request.auth.uid == uid || request.auth.token.admin == true);

  allow update: if request.auth != null && (
    (request.auth.uid == uid
      && resource.data.uid == uid
      && request.resource.data.uid == uid
      && request.resource.data.status == resource.data.status
      && request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(["identity", "submittedAt"]))
    || request.auth.token.admin == true
  );

  allow delete: if request.auth != null
    && (request.auth.uid == uid || request.auth.token.admin == true);
}
```

La règle doit être testée dans le simulateur Firebase avant publication. Les règles
ne doivent jamais permettre à un client de s'attribuer le statut `verified`.

## À ne pas confondre

Le consentement dans l'application protège l'ouverture du sélecteur et le traitement
côté interface. Les règles Storage/Firestore protègent l'accès réel aux données sur
les serveurs. Il faut les deux. Le contrôle côté interface ne remplace pas les règles
Firebase, et les règles Firebase ne remplacent pas le consentement du client.

# Firestore rules — nouveaux modules Bilocost

Ces règles sont à **fusionner** dans les règles Firestore existantes, à l'intérieur de
`match /databases/{database}/documents {`. Ne remplacez pas les règles actuelles :
les collections `users`, `items`, `events`, `chats` et `rentalListings` ont
leurs propres besoins et ne doivent pas être cassées.

```javascript
match /services/{serviceId} {
  allow read: if resource.data.status == "ACTIVE";
  allow create: if request.auth != null
    && request.resource.data.ownerId == request.auth.uid
    && request.resource.data.status == "PENDING_SUBSCRIPTION"
    && request.resource.data.subscriptionAmountUSD == 6
    && request.resource.data.title is string
    && request.resource.data.title.size() > 0
    && request.resource.data.description is string
    && request.resource.data.description.size() > 0
    && request.resource.data.phone is string;
  allow update: if request.auth != null
    && resource.data.ownerId == request.auth.uid
    && request.resource.data.ownerId == resource.data.ownerId
    && request.resource.data.status == resource.data.status
    && request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(["title", "description", "category", "commune", "phone",
                 "price", "currency", "photo", "updatedAt"]);
  allow delete: if request.auth != null
    && resource.data.ownerId == request.auth.uid;
}

match /adCampaignRequests/{requestId} {
  allow create: if request.auth != null
    && request.resource.data.ownerId == request.auth.uid
    && request.resource.data.status == "PENDING_REVIEW"
    && request.resource.data.title is string
    && request.resource.data.url is string
    && request.resource.data.url.matches("^https://.*");
  allow read: if request.auth != null
    && resource.data.ownerId == request.auth.uid;
  allow update, delete: if false;
}

match /ads/{adId} {
  allow read: if resource.data.status == "ACTIVE";
  allow create, update, delete: if false;
}

match /walletTransactions/{transactionId} {
  allow read: if request.auth != null
    && resource.data.ownerId == request.auth.uid;
  allow create, update, delete: if false;
}
```

## Activation et administration

- Une fiche de service est créée avec le statut `PENDING_SUBSCRIPTION`.
  Après réception et vérification réelle du paiement de 6 USD, un administrateur
  autorisé doit la passer à `ACTIVE` et définir sa date d'expiration.
- Une demande publicitaire est créée dans `adCampaignRequests` avec le statut
  `PENDING_REVIEW`. Après accord commercial et paiement vérifié, l'administrateur
  crée un document dans `ads` avec `status: "ACTIVE"`, `title`, `description`,
  `url`, `slot` (`slot1` ou `slot2`) et éventuellement `image` et `endsAt`.
- Les documents `walletTransactions` sont en lecture seule côté application.
  Seul un backend de confiance devra les créer. Ne donnez jamais aux clients
  l'autorisation d'écrire un solde ou une transaction.
- L'application n'active aucun service payant, aucune publicité payée et aucun
  mouvement de portefeuille sans confirmation réelle du prestataire.

## Limite actuelle

Ce dépôt ne contient pas encore de backend de paiement, de webhook ni de rôle
administrateur sécurisé par custom claims. Les validations/activations ci-dessus
doivent donc rester manuelles via Firebase Console jusqu'à la mise en place d'un
backend fiable. N'ajoutez pas une règle autorisant les utilisateurs à écrire
directement dans `ads` ou `walletTransactions`.

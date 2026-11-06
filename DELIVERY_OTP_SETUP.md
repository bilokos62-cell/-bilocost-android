# Bilocost — code de remise sécurisé

## Parcours utilisateur

1. Le prestataire de paiement confirme réellement la transaction.
2. Le backend du prestataire crée une commande dans `secureOrders` avec `status: "PAYMENT_CONFIRMED"`.
3. L'acheteur ouvre **Profil → Mes achats sécurisés → Afficher mon code de remise**.
4. Le serveur génère un code à 6 chiffres, valable 45 minutes, et le dépose dans la messagerie privée de l'acheteur (`userInbox/{buyerId}/messages`).
5. À la remise physique, l'acheteur communique le code au vendeur.
6. Le vendeur ouvre **Profil → Mes ventes sécurisées**, saisit les 6 chiffres et confirme la remise.
7. Le serveur vérifie l'identité du vendeur, la commande, l'expiration et le code. Après validation, il passe la commande à `DELIVERED` et inscrit un événement dans `secureOrders/{orderId}/auditLogs`.

Le code ne peut être essayé que 5 fois. Après 5 échecs, il est bloqué pendant 15 minutes. Un code expiré doit être renouvelé par l'acheteur.

## Sécurité

- Le navigateur ne crée, ne modifie et ne supprime aucune commande sécurisée.
- Les hachages OTP restent dans la collection privée `deliverySecrets`, interdite aux clients par la règle Firestore par défaut.
- Le code en clair est conservé uniquement dans la boîte privée du compte acheteur.
- Le vendeur ne peut confirmer que les commandes dont son UID correspond au champ `sellerId`.
- Le code est à usage unique.
- La confirmation de livraison marque uniquement la commande `DELIVERED`. Elle ne libère pas les fonds et ne crée aucune transaction de portefeuille.
- Le séquestre, le remboursement et le versement vendeur exigent toujours un prestataire de paiement réel, ses webhooks vérifiés et une logique serveur dédiée.

## Structure attendue de `secureOrders`

Chaque document créé par le backend de paiement doit au minimum contenir :

```json
{
  "buyerId": "Firebase UID de l'acheteur",
  "sellerId": "Firebase UID du vendeur",
  "itemId": "ID de l'annonce",
  "itemTitle": "Nom de l'article",
  "buyerName": "Nom public de l'acheteur",
  "sellerName": "Nom public du vendeur",
  "totalCDF": 125000,
  "status": "PAYMENT_CONFIRMED",
  "createdAt": "Firestore Timestamp"
}
```

Ces valeurs doivent être déterminées par le serveur à partir de la commande et de la confirmation du prestataire. Ne créez pas ces documents depuis le navigateur et ne marquez jamais une commande payée sur la seule base d'un retour client.

## Activation Firebase

Le dépôt contient maintenant les Cloud Functions, mais elles ne sont pas encore déployées. Pour les activer sur le projet `bilocost-a8136` :

1. Le projet Firebase doit être sur le forfait **Blaze** et les API Cloud Functions / Cloud Build / Secret Manager doivent être activées.
2. Définir le secret serveur `DELIVERY_CODE_PEPPER` avec une valeur aléatoire d'au moins 32 caractères. Ne jamais mettre cette valeur dans `index.html`, GitHub ou une variable publique.
3. Depuis la racine du dépôt, exécuter :

```bash
firebase functions:secrets:set DELIVERY_CODE_PEPPER --project bilocost-a8136
firebase deploy --only functions --project bilocost-a8136
```

Les règles Firestore sont déjà préparées dans `firestore.rules`. Elles peuvent être publiées avec :

```bash
firebase deploy --only firestore:rules --project bilocost-a8136
```

## Limite actuelle du projet

Le code de l'application contient encore `PAY.endpoint = ""` et aucun prestataire de paiement n'est connecté. Tant que le prestataire ne confirme pas le paiement et ne crée pas la commande serveur dans `secureOrders`, l'écran de commandes restera vide et le code ne pourra pas être émis. C'est volontaire : aucun code de livraison ne doit valider une commande non payée.

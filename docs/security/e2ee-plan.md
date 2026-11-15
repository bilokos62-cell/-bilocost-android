# Bilocost — plan de chiffrement de bout en bout

## État
Conception et préparation uniquement. La messagerie actuelle enregistre encore le champ `text` lisible dans Firestore : elle n'est donc pas chiffrée de bout en bout. Ne pas annoncer E2EE comme actif.

## Objectif de sécurité
Le texte et les pièces jointes sont chiffrés sur l'appareil de l'expéditeur et déchiffrés uniquement sur l'appareil du destinataire. Firestore, les fonctions Firebase et les administrateurs Bilocost ne doivent recevoir que des données chiffrées.

## Architecture proposée
1. Identité : associer à chaque compte des clés cryptographiques générées localement.
2. Clé privée : conserver la clé privée dans le stockage sécurisé de l'appareil (Android Keystore / iOS Keychain lorsque disponible). Ne jamais l'envoyer à Firebase.
3. Clé publique : publier uniquement la clé publique et ses versions dans un document dédié, avec règles Firestore strictes.
4. Établissement de session : utiliser un protocole éprouvé et audité pour établir des secrets de session entre les deux participants. Ne pas inventer un protocole cryptographique maison.
5. Messages : chiffrer localement le contenu avant l'écriture Firestore. Stocker uniquement le texte chiffré, le nonce, l'identifiant/version de clé, l'expéditeur et les métadonnées minimales.
6. Réception : vérifier l'intégrité puis déchiffrer localement. Un échec de vérification doit bloquer l'affichage.
7. Rotation/récupération : définir le renouvellement des clés, les appareils multiples, la perte d'appareil et la révocation avant la mise en production.
8. Pièces jointes : chiffrement local avant téléversement ; les URL de stockage seules ne doivent pas donner accès au contenu en clair.

## Migration de la messagerie
- Ne pas transformer automatiquement les anciens messages en messages prétendument chiffrés.
- Ajouter une version de schéma explicite (ex. `encryptionVersion`) et séparer les messages historiques non chiffrés des nouveaux messages chiffrés.
- Déployer le client compatible avant d'imposer le nouveau format.
- Bloquer l'envoi chiffré si une clé publique valide manque ou si l'appareil ne peut pas chiffrer.
- Vérifier les règles Firestore : accès limité aux participants ; aucune fonction serveur ne doit déchiffrer le contenu.
- Tester deux comptes et deux appareils, altération de ciphertext, mauvaise clé, rotation et perte d'accès.

## Critères d'acceptation
- Une lecture directe du document Firestore ne révèle aucun texte de message.
- Les journaux, notifications et fonctions ne contiennent jamais de contenu en clair.
- Seuls les participants disposant des clés peuvent déchiffrer.
- Les modifications de ciphertext sont détectées.
- Les anciens messages sont clairement identifiés comme historiques non chiffrés.
- Audit de sécurité indépendant avant activation générale.

## Décisions encore nécessaires
- Bibliothèque/protocole audité compatible Web, Android et iOS.
- Prise en charge ou non de plusieurs appareils par compte.
- Politique de sauvegarde/récupération des clés.
- Chiffrement des pièces jointes et notifications.
- Comportement de modération et de signalement sans accès au contenu en clair.

# Bilocost — logs et monitoring

## État
Préparation du dispositif dans le dépôt. Aucun déploiement ni activation Firebase n'est effectué par ce dossier.

## Objectifs
- Journaux structurés Cloud Functions (JSON) avec horodatage, gravité, nom de fonction et identifiant de corrélation.
- Suivi des appels, durées, erreurs et statuts métier sans enregistrer le contenu des messages, mots de passe, jetons, codes OTP, numéros de téléphone ou données d'identité.
- Tableaux de bord Cloud Logging / Cloud Monitoring : volume d'appels, taux d'erreur, latence p50/p95, erreurs par fonction et disponibilité.
- Alertes sur hausse des erreurs, fonctions indisponibles et latence anormale.
- Conservation et accès aux journaux selon le principe du moindre privilège.

## Convention d'événements
Utiliser `functions/observability.js` pour produire des événements structurés. Les champs autorisés sont des identifiants techniques non sensibles : `event`, `functionName`, `correlationId`, `durationMs`, `status`, `errorCode`.

Ne jamais journaliser :
- texte ou pièces jointes des conversations ;
- clés de chiffrement, jetons Firebase/OAuth, mots de passe ou secrets ;
- code de livraison/OTP, téléphone, email, documents d'identité ;
- corps complet des requêtes ou documents Firestore.

## Mise en service après rétablissement de GitHub
1. Vérifier les secrets GitHub de déploiement Firebase et les autorisations IAM.
2. Déployer les Cloud Functions instrumentées.
3. Vérifier les journaux dans Google Cloud Console → Logging → Logs Explorer.
4. Créer les métriques basées sur les journaux et les tableaux de bord.
5. Créer les alertes et tester une erreur contrôlée en environnement de test.
6. Confirmer la réception des alertes avant de déclarer le monitoring opérationnel.

## Limite actuelle
Les journaux temps réel et alertes ne deviennent actifs qu'après déploiement et configuration dans Google Cloud. La création de ces fichiers ne les active pas à elle seule.

# Adoption sécurisée des Android Skills v1.0.20 — Bilocost

## Décision d'architecture

Bilocost reste une application **Capacitor 7 + HTML/JavaScript + Firebase**, empaquetée dans une Android WebView. Le projet ne contient pas actuellement de module Android natif Kotlin/Compose maintenu dans le dépôt : le dossier `android/` est généré dans le workflow CI avec `npx cap add android`, puis synchronisé.

Les compétences Android officielles sont donc utilisées comme référentiel d'audit et de sécurité. Elles ne justifient pas une migration vers Kotlin/Compose, l'ajout de plugins natifs ou le remplacement de l'application existante.

## Compétences retenues

| Skill Android v1.0.20 | Usage retenu dans Bilocost | Limite |
|---|---|---|
| `android-permissions-security` | Audit des permissions dangereuses et principe du moindre privilège sur le manifeste Android réellement généré | Toute nouvelle permission sensible exige une justification produit et une revue dédiée |
| `android-intent-security` | Contrôle des composants exportés, des intent-filters et de l'exposition inter-applications | Pas d'IntentSanitizer ni de dépendance AndroidX ajoutée tant qu'aucun code natif ne reçoit d'Intent non fiable |
| `testing-setup` | Conserver la validation JavaScript actuelle et ajouter un audit du manifeste généré dans la CI Android | Les recommandations Hilt, Espresso, Robolectric, Compose et Dropshots ne s'appliquent pas directement à cette architecture WebView |
| `android-cli` | Référence pour une future inspection ADB / appareil / émulateur | Aucun outil ni SDK n'est installé dans le dépôt par simple adoption documentaire |

## Compétences volontairement différées

- `restore-credentials` : nécessite une intégration Credential Manager native et une validation cryptographique côté serveur. Ne pas l'activer sans conception backend.
- `verified-email` : modifierait le parcours d'authentification actuel. À évaluer séparément, sans remplacer le système existant.
- `edge-to-edge`, `adaptive`, `navigation-3`, `jetpack-compose-performance` : ciblent principalement Jetpack Compose ou une interface native, absente du projet actuel.
- `appfunctions`, `glance`, `wear`, `xr`, `cars`, `camerax`, `media3`, `play-billing` : hors périmètre fonctionnel actuel ou nécessitent une décision produit et des composants natifs.
- `anr-audit-and-fix`, `android-profiler`, `r8-analyzer` : à utiliser avec traces, profils ou configuration native réelle ; ne pas inventer de diagnostic.

## Garde-fous de sécurité ajoutés

1. La CI génère et synchronise le projet Android, puis audite son véritable `AndroidManifest.xml` avant compilation.
2. Les permissions dangereuses non explicitement approuvées font échouer l'audit.
3. Les composants Android exportés sont refusés, sauf l'activité Launcher explicitement identifiée. Les composants avec intent-filters doivent déclarer `android:exported`.
4. `usesCleartextTraffic=true` est refusé.
5. Les permissions et composants autorisés à l'avenir doivent être ajoutés explicitement à la liste d'approbation du script avec une revue de code et une justification.
6. Aucun changement automatique à `allowBackup`, aux règles Firestore/Storage, aux paiements, au séquestre, à l'OTP, aux authentifications ou aux rôles administrateur.
7. Aucun secret, jeton, clé privée ou donnée personnelle ne doit être ajouté au dépôt.
8. Les modules et workflows iOS restent intacts pendant cette phase Android.
9. L'animation de démarrage, ses fichiers et son comportement restent hors périmètre.

## Vérifications

- `npm run build` : validation de la syntaxe et des intégrations source existantes.
- `python3 scripts/audit-android-manifest.py android/app/src/main/AndroidManifest.xml` : audit du manifeste généré par Capacitor.
- `./gradlew assembleDebug` : compilation APK après réussite des audits.

La compilation CI ne prouve pas le bon fonctionnement sur tous les téléphones. Les parcours réels, les permissions à l'exécution, les liens externes, le clavier, la navigation système et les notifications doivent encore être testés sur appareil Android.

# Bilocost — audit et plan de consolidation des branches
Date : 2026-11-23
Dépôt : bilokos62-cell/-bilocost-android
Branche de référence : main
Branche de suivi : maintenance/branch-consolidation-2026-11

## Décision de sécurité
Aucune branche n'est supprimée, aucune fusion n'est forcée, aucun déploiement Firebase ni workflow GitHub Actions n'est lancé par cet audit. Le dépôt contient des branches divergentes : une fusion globale pourrait écraser des corrections récentes ou réintroduire du code ancien.

## Résultat du recensement
56 branches recensées. Comparaison effectuée par rapport à main :
- 3 branches en avance sans divergence : feature/responsive-tablet-desktop (12 commits), fix/native-splash-animation (5), security/audit-hardening-2026 (8).
- 3 branches en retard sans commit propre : chore/android-skills-safe-adoption, feature/admob-rewarded-theme-unlock, fix/theme-palette-settings-entry-after-location.
- 1 branche identique : main.
- Les autres branches sont divergentes (commits propres et historique main plus récent) et nécessitent une sélection de changements fichier par fichier, pas un merge automatique.

## Branches en avance à examiner en priorité
### feature/responsive-tablet-desktop
12 commits propres. Modifie les workflows Android/iOS/Hosting, index.html, messaging-fix.js, functions/index.js, responsive-layout.css et le validateur. Les modifications sont cohérentes avec l'amélioration responsive et la pagination de messagerie/notifications, mais elles ne sont pas encore validées sur appareils.

### fix/native-splash-animation
5 commits propres. Modifie fortement le workflow Android et ajoute scripts/inject-android-splash.py. Build APK non vérifié : ne pas fusionner avant validation locale ou CI disponible et inspection du comportement de démarrage.

### security/audit-hardening-2026
8 commits propres. Ajoute ADMIN_ACCESS.md, SECURITY_AUDIT_2026.md, admin/index.html et functions/scripts/set-admin-claim.js, et modifie le workflow Hosting et le validateur. Le dossier /admin est une porte d'accès, pas encore un tableau de bord complet. Provisionnement admin, Firebase Emulator Suite, App Check/IAM réels et tests de sécurité restent à effectuer.

## Branches en retard ou sans différence propre
- chore/android-skills-safe-adoption
- feature/admob-rewarded-theme-unlock
- fix/theme-palette-settings-entry-after-location
Ces branches n'apportent aucun commit unique par rapport à main dans la comparaison effectuée. Ne pas les fusionner.

## Branches divergentes
Les branches suivantes ont un historique distinct de main. Elles doivent être comparées fichier par fichier avant de récupérer un changement. Ne pas faire de merge global :
- chore/apple-skills-safe-adoption
- design/bilocost-branded-request-windows
- design/bilocost-custom-alert-dialogs
- design/homepage-visual-refresh
- feat/android-new-loading-screen
- feat/brand-partners-ad-carousel
- feat/ios-hig-accessibility
- feat/ios-loading-screen
- feat/privacy-permissions-cookie-consent
- feat/video-launch-screen
- feature/delivery-otp
- feature/geo-hierarchy-hardening
- feature/in-app-inbox
- feature/multilingual-ui-switch
- feature/national-listing-location
- feature/national-listing-location-v2
- feature/navigation-geography-redesign
- feature/secure-delivery-otp
- fix/android-delivery-otp-parity
- fix/android-gradle-wrapper-timeout
- fix/apply-translations-main-view
- fix/cloud-unread-message-count
- fix/complete-multilingual-ui
- fix/direct-auth-and-brand-icon
- fix/firebase-appcheck-pwa-assets
- fix/firebase-auth-startup
- fix/firestore-inbox-rules-newlines
- fix/geo-location-migration
- fix/geo-selector-observer-and-fallback
- fix/ios-delivery-otp-parity
- fix/language-state-and-global-translation
- fix/listing-location-publication
- fix/messaging-fullscreen-unread-badge
- fix/province-selector-text-contrast
- fix/reliable-video-loader
- fix/remove-custom-startup-overlay
- fix/restore-french-on-language-change
- fix/rollback-loading-screen
- fix/startup-ui-polish
- fix/theme-after-auth
- fix/theme-palette-settings-entry
- hotfix/web-cache-recovery
- ios-setup
- polish/mobile-small-details
- preparation/corrections-video-14259
- revert-font-rendering-change
- rollback/video-launch-overlay
- setup/ios-capacitor-build
- ui/restore-province-locality-list

## Demandes de fusion ouvertes repérées
- #49 — sécurité et accès administrateur : le PR indique que les workflows échouent avant exécution des étapes et que les tests Emulator, paramètres Firebase réels et test d'intrusion restent à faire. Ne pas fusionner en l'état.
- #48 — splash natif Android : build APK non confirmé à cause du quota GitHub Actions. Ne pas fusionner avant validation.
- #47 — personnalisation couleurs/designs : AdMob utilise encore les identifiants de test, préférences locales non synchronisées entre appareils, récompenses Web non prises en charge par le plugin natif. Ne pas activer en production.
- #44 — entrée des 100 palettes : identifiants publicitaires de test ; PR sans validation de build/déploiement.
- #46 — accès direct à l'identification : vérifier le parcours d'inscription et la persistance onboarding avant intégration.
- #40 — fenêtres d'alerte personnalisées : vérifier toutes les interactions et les invites natives avant intégration.

## Blocages techniques identifiés à traiter dans la finalisation
1. Validation complète des workflows/builds non confirmée ; quota Actions à préserver.
2. Règles Firestore et Storage : vérifier chaque collection et chemin réellement utilisés par le client avant toute ouverture. Le Storage refuse par défaut les chemins non explicitement autorisés.
3. Contrôler l'écart entre les règles de création d'annonces (4 photos maximum, champs géographiques requis) et les formulaires/UI qui peuvent envoyer d'autres formes de données.
4. Vérifier la configuration App Check et Firebase réelle (domaines, clés, fournisseurs, IAM) sans exposer de secrets.
5. Vérifier les fonctions Cloud Functions et les index Firestore sur émulateur avant déploiement.
6. Vérifier le comportement réel des parcours utilisateur : inscription, publication, médias, messagerie, commandes/livraison, notifications, langues, récompenses, location et administration.
7. Le mode local de démonstration existe dans certains chemins de messagerie : il doit être clairement isolé et ne jamais afficher de données fictives comme réelles.
8. Les fonctions premium/publicitaires restent en test tant que les IDs de production, la prise en charge Web et les validations des récompenses ne sont pas configurés.

## Ordre de consolidation proposé
1. Conserver main comme référence.
2. Examiner les trois branches en avance sans divergence, une à une, et les intégrer uniquement après tests ciblés.
3. Récupérer les corrections utiles des branches divergentes par fichier, sans écraser les fichiers plus récents de main.
4. Résoudre les six PR ouverts : intégrer seulement les changements vérifiés ; fermer les doublons obsolètes uniquement après confirmation de leur équivalence.
5. Exécuter d'abord les tests locaux et Firebase Emulator Suite. Réserver GitHub Actions pour un seul cycle de validation ciblé lorsque le quota est disponible.
6. Ne déployer et ne fusionner dans main qu'après validation explicite des contrôles de sécurité et des parcours critiques.

## Statut
Audit des branches réalisé ; consolidation du code et validation de production non terminées. Ce document n'affirme pas que Bilocost est finalisé.

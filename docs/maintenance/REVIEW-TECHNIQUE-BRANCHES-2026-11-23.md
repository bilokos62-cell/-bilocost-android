# Revue technique des branches — 23 novembre 2026

Périmètre : comparaison de trois branches en avance sur `main` et lecture des fichiers modifiés. Aucun workflow GitHub Actions n'a été lancé. Aucun déploiement Firebase n'a été effectué.

## Résultat de comparaison

| Branche | En avance | En retard | Fichiers modifiés |
|---|---:|---:|---:|
| `feature/responsive-tablet-desktop` | 12 commits | 0 | 8 |
| `fix/native-splash-animation` | 5 commits | 0 | 2 |
| `security/audit-hardening-2026` | 8 commits | 0 | 6 |

## Décisions de consolidation

### 1. Responsive tablette / desktop

Éléments examinés :
- `responsive-layout.css` ajoute des points de rupture à 700, 900, 1100 et 1600 px, une navigation latérale desktop et des grilles plus larges.
- `index.html` référence la feuille responsive et contient les adaptations de navigation / Reels.
- `functions/index.js` borne l'écoute des messages et pagine les notifications diffusées par l'administration.
- Les workflows Android, iOS et Hosting doivent copier la nouvelle feuille CSS dans le paquet final.

Décision : branche techniquement intéressante, mais pas encore intégrée. Les sélecteurs CSS et les parcours Reels doivent être vérifiés dans les vrais écrans et sur appareils. Les Reels nécessitent aussi une validation des règles Firestore/Storage, des droits de publication et des uploads ; la présence de l'interface ne prouve pas que le parcours complet est sécurisé.

### 2. Splash Android natif

Éléments examinés :
- `scripts/inject-android-splash.py` injecte un écran de chargement animé uniquement si Capacitor signale Android.
- Le workflow Android copie le logo, exécute l'injection et prépare les ressources Android.

Décision : ne pas fusionner le workflow avant revue complète de sa partie Gradle et vérification des fichiers requis. Le résultat visuel, le comportement en cas de chargement bloqué, l'accessibilité et le démarrage réel restent à tester sur APK/appareil. Aucun build n'a été lancé pour préserver le quota Actions.

### 3. Durcissement sécurité / administration

Éléments examinés :
- `admin/index.html` authentifie l'utilisateur et vérifie le custom claim Firebase `admin: true`.
- `functions/scripts/set-admin-claim.js` attribue le rôle depuis un environnement de confiance avec Application Default Credentials.
- `ADMIN_ACCESS.md` explique l'accès à /admin/.
- `SECURITY_AUDIT_2026.md` déclare explicitement qu'il s'agit d'une revue de code, sans audit de la console Firebase ni test d'intrusion.

Décision : conserver cette branche comme proposition de sécurité, sans ouvrir l'administration en production pour l'instant. La page est une porte d'authentification, pas un tableau de bord métier : son propre texte confirme que les modules d'administration ne sont pas encore activés. Il reste à tester les règles avec Firebase Emulator Suite, vérifier App Check, MFA, IAM, secrets GitHub, permissions des workflows et journaux.

## Bloqueurs communs avant fusion

1. Tests automatisés locaux et Firebase Emulator Suite à exécuter dans un environnement disponible.
2. Vérification des règles Firestore et Storage par scénarios autorisés / refusés.
3. Vérification des chemins d'upload et des permissions des médias Reels.
4. Revue de tous les workflows modifiés, notamment les scripts d'injection et les fichiers copiés.
5. Validation Android réelle pour le splash et validation web/tablette/desktop pour le responsive.
6. Vérification de l'état Firebase réel (Authentication, App Check, Hosting, Functions) avant toute ouverture publique.

## Garde-fous appliqués

- Aucune branche n'a été supprimée.
- Aucune PR existante n'a été fusionnée ou fermée.
- `main` n'a pas été modifiée.
- Aucun workflow Actions n'a été déclenché.
- Aucun déploiement Firebase n'a été lancé.

Cette revue décrit ce qui a été lu dans le dépôt ; elle ne constitue pas une validation d'exécution ni une certification de sécurité.

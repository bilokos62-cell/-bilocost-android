# Bilocost — adoption sécurisée des pratiques Apple

Ce document adapte les pratiques utiles du dépôt https://github.com/rshankras/claude-code-apple-skills à l'architecture réelle de Bilocost.

## Architecture à préserver
- Application existante : HTML/JavaScript + Capacitor 7 + Firebase.
- iOS : projet Capacitor généré en CI sur macOS ; le projet Xcode n'est pas la source principale.
- Android et Web : partagent l'application HTML et les modules JavaScript.
- Firebase : Firestore, Storage et Cloud Functions ; les règles serveur sont une frontière de sécurité.
- ios-hig.js est réservé à la compilation iOS et ne doit pas être injecté dans Android ou le site Web.
- L'animation de démarrage « écran de chargement .mp4 » est en pause et constitue un fichier protégé.

Les recettes SwiftUI/UIKit du dépôt Apple ne sont pas copiées automatiquement : elles ne sont pertinentes que si une fonctionnalité native Capacitor est réellement nécessaire.

## Pratiques retenues
| Source Apple Skills | Adaptation Bilocost |
|---|---|
| iOS UI Review + HIG | Audit des écrans, safe areas, tailles tactiles, clavier, navigation, états vides/erreur |
| Accessibility Audit | Contrôles des noms accessibles, VoiceOver, Dynamic Type, contraste et réduction des animations |
| Navigation Patterns | Vérifier le parcours réel Capacitor ; ne pas reconstruire la navigation en SwiftUI |
| Characterization Tests | Décrire et tester le comportement existant avant toute refonte |
| TDD Bug Fix / Feature | Reproduire un défaut, ajouter un contrôle, corriger puis vérifier les régressions |
| Flow Walkthrough | Tester les parcours complets : inscription, recherche, annonce, discussion, commande, livraison |
| Fitness Functions | Contrôles automatiques d'architecture et de modules dans npm run build |
| Security + Release Review | Examiner Firestore, Storage, Cloud Functions, confidentialité, erreurs et préparation App Store |
| Localization Setup | Préserver le sélecteur de langue existant ; ne pas introduire String Catalogs SwiftUI dans le WebView |

## Règles de protection obligatoires
1. Ne jamais pousser directement sur main. Toute modification passe par une branche et une Pull Request.
2. Une PR ne fusionne pas si les validations disponibles échouent.
3. Ne pas modifier « écran de chargement .mp4 » tant que l'utilisateur n'a pas explicitement repris le travail sur l'animation.
4. Ne pas remplacer index.html, les règles Firebase, les index ou les Cloud Functions par une version simplifiée.
5. Toute modification de firestore.rules, storage.rules ou functions/ doit expliquer les collections, les rôles et les données affectés et inclure des tests adaptés avant déploiement.
6. Ne jamais intégrer de clé privée, jeton, secret ou donnée client dans le dépôt.
7. Garder les améliorations iOS dans des modules injectés uniquement dans le workflow iOS, sauf décision explicite de partage.
8. Après fusion, vérifier séparément les compilations iOS et Android et le déploiement Web/Firebase. Une compilation réussie ne prouve pas le fonctionnement réel sur appareil.
9. Ne pas déclarer VoiceOver, Dynamic Type, Dark Mode, paiement, séquestre ou livraison validés sans test réel correspondant.
10. Les changements visuels ne doivent pas supprimer, déplacer ou dupliquer les fonctions déjà présentes sans justification produit.

## Parcours de test de référence
- Démarrage et authentification.
- Recherche, filtres et localisation dans les provinces.
- Consultation et publication d'une annonce.
- Messagerie : ouverture, réception, lecture et badge non lu.
- Favoris, panier, profil et portefeuille.
- Commande, statut, confirmation de livraison.
- Location et contrôle d'identité.
- Changement de langue et conservation du choix.
- Refus d'accès aux photos/fichiers et accès aux justificatifs privés.

Pour chaque parcours, noter : plateforme, prérequis, étapes, résultat attendu, résultat observé et preuve (log, capture ou run CI).

## Critères d'acceptation d'une PR
- [ ] Périmètre limité et fichiers touchés justifiés.
- [ ] Aucun changement à l'animation en pause.
- [ ] Aucune régression Web/Android causée par un module iOS.
- [ ] Validation syntaxique et tests concernés réussis.
- [ ] Règles d'accès et confidentialité vérifiées si données/backend touchés.
- [ ] Limites connues et tests manuels restants explicitement signalés.
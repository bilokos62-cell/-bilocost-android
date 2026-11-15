# Backlog des corrections Bilocost

## Priorité haute

- [ ] Réduire et masquer proprement l'écran noir au lancement.
- [ ] Afficher un état de chargement immédiatement, avant les initialisations asynchrones.
- [ ] Vérifier les erreurs d'initialisation et prévoir un état de reprise si Firebase ou le réseau est indisponible.

## Priorité moyenne

- [ ] Corriger le chevauchement entre l'en-tête fixe et le contenu du profil.
- [ ] Corriger le recouvrement du contenu par la navigation basse.
- [ ] Vérifier les marges de sécurité sur différents formats d'écran Android.

## Vérifications complémentaires

- [ ] Identifier pourquoi deux icônes Bilocost sont visibles dans le tiroir d'applications.
- [ ] Tester la netteté des photos d'annonces sur un appareil réel, en vue carte et en galerie.
- [ ] Vérifier que le redimensionnement des images conserve une qualité acceptable et ne provoque pas de fichiers excessivement lourds.

## Critères de validation

- [ ] Démarrage testé à froid et à chaud.
- [ ] Aucun titre ni texte masqué par les barres fixes.
- [ ] Défilement correct sur petits et grands écrans.
- [ ] Photos lisibles, sans flou ajouté par le traitement de l'application.
- [ ] `npm run build` réussi.
- [ ] `npm test` réussi.
- [ ] Workflow GitHub réussi avant toute publication.

Les cases ne doivent être cochées qu'après vérification réelle.
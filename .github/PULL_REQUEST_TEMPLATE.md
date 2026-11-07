## Objectif
<!-- Quel problème cette PR résout-elle ? -->

## Périmètre
- [ ] Interface iOS uniquement
- [ ] Web / Android partagé
- [ ] Firebase / sécurité / données
- [ ] CI / tests / documentation

## Protection du projet
- [ ] L'animation « écran de chargement .mp4 » n'a pas été modifiée.
- [ ] Aucun secret ou donnée personnelle n'a été ajouté.
- [ ] Les fonctions existantes et les fichiers non concernés sont préservés.
- [ ] Les changements iOS ne sont pas injectés dans Web/Android sans décision explicite.
- [ ] Si les règles Firebase ou Cloud Functions changent, les impacts d'accès et les tests sont décrits.

## Vérifications
- [ ] npm run build réussi.
- [ ] Compilations iOS / Android vérifiées si concernées.
- [ ] Déploiement Web/Firebase vérifié si concerné.
- [ ] Tests manuels réels indiqués (appareil, parcours, résultat).

## Risques et limites
<!-- Ce qui n'a pas pu être testé, les migrations éventuelles, le rollback. -->
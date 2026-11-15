# Checklist avant mise à jour Bilocost

## Avant modification
- [ ] Confirmer la branche et le commit de départ.
- [ ] Reproduire chaque anomalie et conserver une preuve.
- [ ] Identifier le composant et la cause avant de modifier le code.

## Après modification
- [ ] Relire le diff et vérifier qu'aucune fonctionnalité existante n'a été supprimée.
- [ ] Lancer `npm run build`.
- [ ] Lancer `npm test`.
- [ ] Vérifier les workflows GitHub Android, iOS et Firebase concernés.
- [ ] Tester sur appareil Android réel, notamment le démarrage et le défilement.

## Publication
- [ ] Confirmer que les workflows sont verts.
- [ ] Confirmer le déploiement ou la génération de l'application.
- [ ] Effectuer un contrôle après publication.

Aucune publication ne doit être annoncée sur la seule base d'un commit.
# Run 031 - multi-village bottom sheet selector

- [x] Preflight: git clean, fiche run, spec multi-village, rules, SPEC, briefing Pixi, skills HUD/design-system/tests lus.
- [x] Cartographier `GameHeader`, `MultiVillageBottomSheet`, `useMyVillagesQuery`, DTO `JoinedVillage`, tests frontend existants.
- [x] Brancher le clic du nom de village sur le bottom sheet sans ouvrir de menu concurrent.
- [x] Préserver les flèches gauche/droite comme actions directes `setVillage`.
- [x] Mapper uniquement les données réelles disponibles: id, nom, coords, capitale, étiquette, état actif.
- [x] Ajouter un test frontend ciblé pour ouverture, sélection, fermeture, flèches, et absence du menu inline.
- [x] Lancer tests Pixi ciblés puis `yarn static-check`.
- [x] Review 5 axes + review indépendante obligatoire.
- [ ] Docs impact, archive run, README, commit.

## Notes

- Scope frontend uniquement: `battleforthecrown-pixi`.
- SPEC applicable: §C frontend consommateur, pas de logique métier autoritative côté client.
- Données riches non disponibles à ne pas inventer: ressources, activités, alertes, stratégie, puissance par village.
- Les tests IG user restent nécessaires car le diff touche un header React rendu dans le jeu.
- `--runInBand` n'est pas une option Vitest; relance ciblée correcte avec env Vite explicites.
- Review indépendante cycle 1: BLOCK car rapport final non encore renseigné; mineurs flèche précédente + single-village corrigés.
- Correction user: conserver la structure visuelle du composant design-system; ressources/activités indisponibles rendues en tirets neutralisés, puissance réelle si disponible, tri alphabétique branché.
- Review indépendante finale: GO, aucun finding bloquant/majeur.

## Review

- Correctness: les interactions demandées sont couvertes par Vitest; les données riches absentes ne sont pas remplies avec des zéros.
- Readability: le mapping `JoinedVillage` -> item sheet est isolé dans `multiVillageSheet.ts`; le header garde seulement l'orchestration.
- Architecture: pas de nouvelle logique métier côté client, seulement consommation de données REST existantes (`/village`, puissance royaume).
- Security: aucune donnée publique nouvelle ni mutation API ajoutée.
- Performance: tri local sur une petite liste de villages; impact négligeable.
- Review indépendante: GO final après correction du rapport, du single-village, de la flèche précédente et du tri non-opérationnel.

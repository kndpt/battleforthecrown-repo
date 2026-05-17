# Run 026 - world tempo plumbing clean cut

- [x] Préflight : git clean, fiche run, rules, SPEC et spec 23 lus.
- [x] Cartographie : callsites `gameSpeed` / `economy.productionRate` / régen barbare / couronnes localisés.
- [x] Contrat shared : `WorldConfig.tempo` + `TempoService` + tests pure-logic.
- [x] Backend : brancher construction, training, travel, capture, régen barbare, production ressources, couronnes.
- [x] Fixtures/migration : config smoke, seed SQL, migration JSON clean cut.
- [x] Vérification : unit backend ciblé vert ; smokes backend, tests Pixi et static-check verts.
- [x] Archive run + index.

## Notes

- Scope volontairement limité à la plomberie tempo. Les valeurs absolues docs/shared restent pour le run 027.
- Callsite régen barbare confirmé : `BarbarianRuntimeService.catchUpVillage` et `catchUpResources`.

## Review

- Correctness : opérateur tempo centralisé dans `TempoService`; callsites backend branchés par axe.
- Readability : clean cut schema/config, pas d'alias legacy.
- Architecture : server-authoritative conservé ; frontend seulement estimations d'affichage.
- Security : aucun secret, aucune surface auth modifiée.
- Performance : impact négligeable, calculs locaux O(1).

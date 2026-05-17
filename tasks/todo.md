# Run 027 - world tempo recalibrate MVP constants

- [x] Preflight: git clean, fiche run, rules, SPEC, run 026 et spec tempo lus.
- [x] Cartographie: docs gameplay et constantes shared contenant des durees/debits a recalibrer.
- [x] Recalibrer les specs gameplay `02/03/06/07/10/13/14/15` au Standard MVP `tempo.global = 1.0`.
- [x] Aligner les constantes shared de duree/debit avec les docs.
- [x] Review 5 axes + audit `rg` des durees legacy.
- [x] Verification: tests adaptes + `yarn static-check`.
- [x] Archive run + `tasks/README.md` + commit.

## Notes

- Scope strict: valeurs absolues docs/shared uniquement.
- Hors scope: aucune formule, aucun `TempoService`, aucune logique backend/frontend.
- Invariants wall-clock intouchables: bouclier 48 h, cooldown style 24 h, reset quotidien 04:00, abandon 14 j.

## Review

- Correctness: docs gameplay et constantes shared alignées sur compression `÷4` pour durées et `×4` pour débits; tests de contrat et smoke scout ajustés.
- Readability: valeurs arrondies au multiple de 5 s quand nécessaire; sources de vérité gameplay gardées dans `docs/gameplay`.
- Architecture: aucune formule ni logique `TempoService` modifiée; uniquement valeurs absolues à `tempo.global = 1.0`.
- Security: aucun endpoint, auth ou secret touché.
- Performance: impact runtime neutre hors constantes de durée/débit attendues.

---
name: Pilote 000 leçons
description: Run pilote audit power déjà DONE, contexte à ne pas re-couvrir
type: project
---

Run 000 (`tasks/runs/archive/000-pilote-audit-power.md`) a audité spec 09 § Système de puissance (4 sous-sections, hors Classements post-MVP). DONE 2026-05-10.

**Tickets ouverts** issus du run :
- `tasks/29-power-public-visibility-missing.md` — INV-5/INV-7 endpoints publics manquants
- `tasks/30-power-council-hall-missing.md` — Salle du Conseil absente de BUILDING_TYPES/DEFINITIONS/WEIGHTS
- `tasks/31-power-snapshot-kingdom-field-misnamed.md` — champ DB `PowerSnapshot.kingdom` mal nommé

**Why** : ne pas relancer un audit power dans le cadre Phase 1 ; les 3 tickets sont les actions résiduelles à exécuter. Le ticket 30 (Salle du Conseil) sera probablement re-touché par l'audit spec 03 (buildings) — coordination à acter.

**How to apply** : quand le lead demande un audit Phase 1, exclure spec 09 du périmètre des nouveaux runs. Si le périmètre touche les bâtiments, mentionner l'overlap potentiel avec ticket 30.

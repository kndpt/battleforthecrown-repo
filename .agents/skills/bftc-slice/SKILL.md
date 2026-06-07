---
name: bftc-slice
description: Use when splitting a large BFTC roadmap/spec/plan into multiple vertical `tasks/runs` with dependencies.
---

# BFTC Slice

But : transformer un gros sujet en runs verticaux `PLANNED`, vérifiables seuls. Ne pas exécuter.

## Protocol

1. Lire source, `tasks/README.md`, `tasks/runs/README.md`, `tasks/lessons.md`.
2. Scanner actifs + archives comme `bftc-plan` pour doublons/dépendances.
3. Découper en tranches end-to-end, pas par couche technique.
4. Pour chaque tranche :
   - `Run`: `<id>-<slug>`
   - `Type`: `AFK` ou `HITL`
   - `Blocked by`: ids ou `Aucun`
   - `Collision zones`: fichiers/domaines
   - `Behavior`: résultat joueur/système observable
   - `Acceptance`: checks binaires, automatisables ou visuels
5. Présenter ordre de merge/exécution + parallélisable.
6. Écrire les fiches seulement après validation user.

## Gates

- Pas de run horizontal `backend only` si le comportement réel traverse API/UI/worker.
- Si une tranche dépasse 5 fichiers estimés ou deux comportements, redécouper.
- Ne pas masquer doublon ou archive déjà résolue.
- Ne pas commit.

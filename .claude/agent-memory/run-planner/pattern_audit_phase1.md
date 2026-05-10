---
name: Pattern audit Phase 1
description: Stratégie standard de segmentation d'une phase d'audit multi-specs en runs unitaires
type: project
---

Phase 1 (Consolidation de l'existant) couvre 6 specs tranchées + 1 en chantier. Un run unique = trop large.

**Règle** : 1 run = 1 spec. Ordre dicté par les dépendances de contenu (fondations d'abord, consommateurs ensuite).

**Why** : la roadmap acte « pour chaque spec, soit le code est conforme, soit l'écart est ticketé ». Découper par spec donne un livrable atomique par run, des tickets d'écarts plus précis, et un ordre de passage qui évite de re-toucher du code déjà audité.

**How to apply** : pour Phase 1, l'ordre proposé est :
1. Spec 02 économie/progression (fondement)
2. Spec 03 buildings (catalogue, conso de tout)
3. Spec 08 units (catalogue, conso combat/barbares)
4. Spec 04 combat (résolution, conso 02/03/08)
5. Spec 06 barbarians (consomme 03/08)
6. Spec 10 conquest (consomme 03/08, débloque Phase 5)
7. Spec 07 barbarian-spawning (en chantier — finaliser ou acter le report)

Spec 09 power déjà couverte par run pilote 000.

Chaque sous-run suit le même squelette que `tasks/runs/archive/000-pilote-audit-power.md` : T1 invariants spec → T2 cartographie code → T3 confrontation tableau → T4 fix < 50 lignes → T5 tickets pour le reste → T6 tests pure-logic manquants → T7 yarn test vert → T8 docs alignées.

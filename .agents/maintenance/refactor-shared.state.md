# refactor-shared — état (réécrit chaque run)

last: 2026-07-12 | thème: test gap `logic/` (travel-time, building-cost, production)
full: `archive/refactor-shared/2026-07-12-full.md`

## OPEN

PR ouverte, en revue : [#291](https://github.com/kndpt/battleforthecrown-repo/pull/291) `maint(refactor-shared): cover logic/ formula test gap` (branche `claude/practical-hypatia-gz53hq`, imposée par le harness cloud pour ce run).

## Candidats prochains runs

1. **split `rankings/final-ranking-snapshot.ts`** — déjà bien isolé, faible priorité.
2. **`events/types.ts` (524 L) / `events/schemas.ts` (415 L)** — plus gros fichiers du package désormais ; à auditer si un thème de découpe clair émerge (actuellement schémas/types déjà groupés par domaine d'event, risque de sur-découpe).
3. **`combat/dtos.ts` (338 L)** — 2e plus gros fichier hors events/village ; pas encore audité en détail, à checker structure/cohésion au prochain run.

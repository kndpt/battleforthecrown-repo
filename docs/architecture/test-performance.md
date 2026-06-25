# Performance des tests — base & historique

Doc de référence **dès qu'on touche à la vitesse des tests** (smokes surtout). Lire avant d'optimiser, ajouter une entrée d'historique après chaque opti.

Sources adjacentes (ne pas dupliquer, référencer) :
- Stratégie (quoi tester, quel niveau) → skill [`bftc-tests-policy`](../../.agents/skills/bftc-tests-policy/SKILL.md).
- Orchestration / I/O / layout de la suite smoke → [`smoke-tests.md`](./smoke-tests.md).
- Leviers de scaling détaillés (workers, `max_connections`, pool Prisma, env de poll) → [`db-setup.md` § DB smoke](./db-setup.md#db-smoke-battleforthecrown_smoke--clones-par-worker).

## Modèle de coût (comprendre avant d'optimiser)

```
wall-clock ≈ max( durée du plus long fichier , Σ durées / maxWorkers ) + overhead de boot Nest
```

- La durée d'un fichier smoke est surtout de l'**attente** (jobs pg-boss enchaînés, poll Outbox), **pas du CPU**. Comprimer la latence d'attente bat presque toujours l'ajout de workers.
- Chaque fichier boote un `AppModule` Nest complet + pg-boss (un boot par fichier, pas un seul pour la suite). C'est l'overhead incompressible.

Conséquences pratiques :
- Un fichier qui pèse > moyenne × 3 plafonne tout → le **splitter** (gain réel).
- Ajouter des workers ne sert **que si** un fichier dépasse `Σ/workers` ; sinon on est déjà borné par le plus long fichier ou l'overhead.
- Au-delà d'un point, **+1 fichier = +1 boot Nest** qui annule le gain de parallélisme (mesuré : un 2ᵉ split de `army-training` était neutre).

## Ordre des leviers

0. **Comprimer la latence worker** (env test-gated `PGBOSS_WORKER_POLL_MS`, `OUTBOX_POLL_INTERVAL`) — le moins coûteux, le plus rentable. Mécanique dans `queue-worker.helper.ts` + `jest-smoke-setup.ts`, doc dans `db-setup.md`.
1. **Splitter le plus long fichier** par sous-domaine.
2. **Monter `maxWorkers` + `SMOKE_WORKERS` en miroir** (plafond ≈ cores physiques ; au-delà, contention annule le gain).
3. **`max_connections` Postgres / pool Prisma** si `too many clients`.

Détail de chaque levier : `db-setup.md`. Ne pas anticiper — appliquer le levier minimum qui résout le symptôme mesuré.

## Méthode de mesure (reproductible)

```bash
# Durée totale (chaîne réelle, defaults)
cd battleforthecrown-backend && yarn test:smoke        # ligne "Time:" de Jest

# Durée par fichier (pour repérer le pôle long et le déséquilibre)
yarn test:smoke:preflight
node_modules/.bin/jest --config ./test/jest-smoke.json --forceExit \
  --json --outputFile=/tmp/smoke.json
node -e 'const r=require("/tmp/smoke.json");
  const a=r.testResults.map(t=>({f:t.testFilePath.split("/").pop(),ms:t.endTime-t.startTime}));
  a.sort((x,y)=>y.ms-x.ms); let s=0; a.forEach(x=>s+=x.ms);
  a.forEach(x=>console.log(String(x.ms).padStart(7),x.f));
  console.log("Σ",s,"floor=Σ/workers",Math.round(s/10));'

# Comparer un nombre de workers (choisir le sweet spot, pas le max)
for W in 8 10 12; do SMOKE_WORKERS=$W yarn test:smoke:preflight >/dev/null 2>&1; \
  node_modules/.bin/jest --config ./test/jest-smoke.json --maxWorkers=$W --forceExit \
  2>&1 | grep "Time:"; done
```

Toujours : 3 runs pour distinguer le signal de la variance (machine sous charge → outliers), et confirmer **0 régression** (`109 passed` ou le total courant).

## Historique des optimisations

> Une entrée par opti, la plus récente en haut. Format : date, périmètre, avant→après, leviers, ce qu'on a écarté (mesuré).

### 2026-06-23 — Smokes backend : latence worker + split + 10 workers (46 s → ~16 s, −65 %)

- **Périmètre** : suite smoke backend (109 tests). Avant : ~46 s (8 workers). Après : ~16 s (10 workers). 0 régression.
- **Diagnostic** : le wall n'était pas du CPU mais l'attente de jobs pg-boss enchaînés (training → unité suivante, combat → retour). Les job workers sans `workOptions` pollaient au défaut pg-boss (2 s). `army-training` seul = 44 s, monopolisait un worker ≈ tout le wall.
- **Leviers** (par impact) :
  1. **Compression latence worker** (−57 % à lui seul) : `PGBOSS_WORKER_POLL_MS=500` (plancher pg-boss, via `withPollOverride` dans `queue-worker.helper.ts`) + `OUTBOX_POLL_INTERVAL=250`. Gated test-only — prod/dev inchangés.
  2. **Split** `army-training` (44 s, 8 tests série) → `army-training` + `army-training-queue` (4+4).
  3. **`maxWorkers` 8 → 10** (+ défaut `SMOKE_WORKERS` 10).
- **Écarté (mesuré)** : 3ᵉ split (`army-training-cancel`) neutre (16,0 vs 16,2 s) — wall borné par `Σ/workers + boot`, pas par un fichier-pôle. 12 workers = +0,2 s seulement + sature 12 cœurs et frôle `max_connections` (12×25=300).
- **Commits / fichiers** : `queue-worker.helper.ts`, `jest-smoke-setup.ts`, `jest-smoke.json`, `smoke-preflight.sh`, split `army-training*`.

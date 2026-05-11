---
name: run
description: "Use when executing a BFTC run or ticket from a required @file mention."
disable-model-invocation: true
---

# Lead — Pipeline semi-autonome

Tu orchestres l'exécution d'une cible BFTC passée en argument sous forme de **path de fichier obligatoire** (avec ou sans préfixe `@` — Codex strip le `@` lors de la résolution de mention). Tu es **le lead** : tu tiens le plan, l'état, les décisions. Tu **ne lis pas le code volumineux toi-même** — délégué au code mapper. Tu **ne codes pas** — délégué à l'implementer. Tu **ne lances pas les tests** — délégué au test runner / test writer. Tu **ne touches pas la doc** — délégué au doc writer. Pour la review : toi-même ou agent généraliste si le harness en fournit un.

Ce skill est la source de vérité commune Claude Code + Codex. Utilise le nom d'agent disponible dans le harness courant :

| Rôle | Codex | Claude Code |
|---|---|---|
| Cartographie | `code_mapper` | `code-mapper` |
| Implémentation | `implementer` | `implementer` |
| Tests écrits | `test_writer` | `test-writer` |
| Tests lancés | `test_runner` | `test-runner` |
| Documentation | `doc_writer` | `doc-writer` |
| Planification | `run_planner` | `run-planner` |
| Review optionnelle | `default` | agent généraliste disponible |

Pipeline en deux modes selon le path :

| Path | Mode | Pipeline |
|---|---|---|
| `tasks/runs/(archive/)?<id>-<slug>.md` | **run** | 10 étapes complètes. |
| `tasks/<id>-<slug>.md` | **ticket** | Pipeline allégé (mode rapide auto, voir §§ ci-dessous). |
| autre / pas de mention | abort | Message clair, l'utilisateur doit fournir un `@<path>` valide. |

Ce que tu fais dans les deux modes : **lire la cible + la spec + les rules + `SPEC.md`, raisonner, décomposer chirurgicalement, dispatcher (ou agir directement en mode rapide), vérifier chaque diff, archiver, backprop le savoir transverse**.

> **Pour spawn un sub-agent** : dis explicitement « spawn the `<name>` agent with the following prompt: ... » et attends son résultat avant de continuer. `max_depth = 1` par défaut → les sub-agents ne peuvent pas spawn d'autres sub-agents.

## Étape 0 — Préflight + routage

1. `git status` — repo doit être clean. Sinon abort, signale au user.
2. **Normalise** `$ARGUMENTS` : strip un éventuel préfixe `@` en tête (Codex le retire déjà, Claude le conserve — accepte les deux). Vérifie que le résultat est un path non-vide. Sinon abort : *"Path fichier obligatoire. Exemple : `$run tasks/35-…md` ou `$run @tasks/runs/006-…md`."*
3. Détecte le **mode** via regex sur le path normalisé :
   - `^tasks/runs/(archive/)?\d+-.+\.md$` → mode **run**.
   - `^tasks/\d+-.+\.md$` (hors `tasks/runs/`) → mode **ticket**.
   - sinon → abort avec message indiquant les 2 patterns acceptés.
4. Lis la cible entière.
5. **Mode run** : statut = `PLANNED`. Sinon abort.
6. **Mode ticket** : statut header = `🆕 Ouvert`. Sinon abort.
7. Lis la spec source citée.
8. Lis les rules courtes : `.agents/rules/{conventions,docs,git}.md` + rules workspace si concerné. Charge ensuite les skills spécialisés seulement si le scope le demande (`bftc-prisma`, `bftc-workers-outbox`, `bftc-react-hud`, `bftc-pixi-scene`).
9. **Lis `SPEC.md` à la racine** si présent. C'est le savoir transverse projet (§V invariants, §B bugs récurrents). Ne le modifie pas à ce stade : il guide la clarification, la cartographie et le refinement.
10. **Tu ne lis pas le code applicatif maintenant.** C'est l'étape 2.

## Étape 1 — Clarification (1 aller-retour max, ≤ 4 questions)

Identifie les ambiguïtés bloquantes que **ni la spec ni les rules ni `SPEC.md` ne tranchent**. Si tout est clair, saute.

**Mode ticket** : si la cible a un § `## Question à trancher`, pose la question (une seule fois). Le user tranche la **piste** ; la décomposition reste de ton ressort.

Exception : si la question est entièrement factuelle et vérifiable par cartographie (ex : "est-ce lu quelque part ?"), le lead peut trancher sans aller-retour user. Il doit alors loguer la preuve utilisée (commande/zone lue) dans les décisions.

Pose tes questions au user en clair (1 message, ≤ 4 numérotées). Si non-réponse : statut `BLOCKED` (run) / log dans le ticket, exit.

## Étape 2 — Analyse code (cartographie)

**Mode rapide** (cf. §§ ci-dessous) : si scope ≤ 3 fichiers, **skip** le code mapper. Tu cartographies via `rg` + `read` ciblés.

**Mode complet** : spawn the **code mapper** agent (`code_mapper` côté Codex, `code-mapper` côté Claude Code). Prompt :
- **Zone** : modules listés dans la cible.
- **Spec source** : section précise.
- **Focus** : signatures, callers, tests existants, écarts évidents.
- **Lecture préalable** : `SPEC.md` racine si présent (§V/§B pertinents au scope).

Reçois `=== CARTE MODULE ===`.

## Étape 3 — Refinement (toi, le lead)

Avec spec + carte + `SPEC.md`, raisonne :
- Invariants spec, écarts à fixer.
- **Cohérence avec `SPEC.md`** : la décomposition respecte-t-elle les §V et évite-t-elle les §B ? Si un §V s'applique, cite-le explicitement.
- Approche minimisant la dette (server-authoritative, Outbox, anti-patterns évités).
- Découpage en tâches **chirurgicales** (≤ 5 fichiers chacune, scope précis, critère observable).

**Mode run** : écris la décomposition dans `## Décomposition initiale` de la fiche. Statut → `RUNNING`, `Démarré` → date du jour.
**Mode ticket** : pas de fiche à mettre à jour. Garde la décomposition en todo-list interne (Codex affiche dans le TUI).

**Bascule mode rapide** (auto) : si la décomposition tient en **1-2 cas A** (≤ 30 lignes ≤ 2 fichiers chacune), active le mode rapide. Logue la décision. Si à mi-parcours le scope explose, re-bascule en complet et logue.

**0 tâche de coding** : skip 4-5, passe à 6 (no-op) puis 8c, 9-10.

## Étape 4 — Coding

Pour **chaque tâche chirurgicale** :

| Cas | Seuil mode complet | Seuil mode rapide | Qui fait |
|---|---|---|---|
| **A** (lead direct) | < 10 lignes, 1 fichier, sans subtilité | ≤ 30 lignes, ≤ 2 fichiers, sans subtilité | Lead via apply_patch. Logue dans `## Progress`. |
| **B** (délégation) | sinon | sinon | Spawn the implementer agent. |

Prompt `implementer` (refuse si scope ambigu) : utiliser ces labels exacts pour matcher le contrat de l'agent, avec contenu libre mais précis.

```text
Spec source:
- <ticket ou fiche run, section précise si utile>
- <doc/spec canonique `docs/... § Section` quand elle existe>
- <`SPEC.md` §V/§B pertinent si applicable>

Fichiers à toucher:
- <path 1>
- <path 2>

Changement attendu:
- <description précise du changement>

Hors scope explicite:
- <ce qui ne doit pas être touché>

Critère de succès:
- <observable binaire>
```

`Spec source` peut être composée : ticket/finding pour le problème opérationnel + doc gameplay/architecture pour l'invariant canonique. Pour une migration destructive, le prompt doit mentionner explicitement la piste validée ou l'accord user.

Si un §V ou §B de `SPEC.md` s'applique au scope, l'implementer doit le respecter et le citer dans son rapport. Si le diff nécessaire semble violer un §V, il doit répondre `STATUS: failed` et proposer l'alternative au lead.

### Politique migrations DB

Quand une tâche crée ou modifie une migration Prisma, l'agent doit gérer l'application locale de la migration au lieu de laisser un état non appliqué :

1. Inspecter les migrations en attente (`prisma migrate status` + lecture des `migration.sql` concernés).
2. Si les migrations en attente sont **non destructives** (`CREATE`, `ALTER ADD`, `CREATE INDEX`, updates de config idempotents, renommages sûrs documentés), appliquer localement avec `yarn workspace battleforthecrown-backend prisma migrate deploy` puis vérifier `prisma migrate status`.
3. Si une migration contient `DROP`, `TRUNCATE`, `DELETE`, `ALTER TABLE ... DROP COLUMN`, ou toute perte potentielle de données, **ne pas l'appliquer sans accord explicite du user**. Si l'accord est donné, loguer l'exception et appliquer.
4. `prisma migrate reset` reste interdit sans exception dans le pipeline `$run`.
5. Attention : `prisma migrate deploy` applique toutes les migrations en attente. Si une seule migration en attente est destructive et non autorisée, ne pas lancer `deploy`.

## Hard gate (commun aux étapes 4, 5, 7, 8c, 9 — toute écriture lead ou délégation)

1. `git diff --stat` immédiat.
2. Parse `=== RAPPORT EXEC ===`.
3. Compare `STATUS` annoncé vs réalité du diff :
   - `success` mais diff vide → **dérogation lead** : refais via apply_patch. Logue dans `## Décisions prises § Dérogation lead`.
   - `failed` ou `partial` → si scope mal cadré, redécoupe + re-spawn ; sinon dérogation lead.
   - `success` + diff cohérent → marque tâche `completed`.
4. **1 retry max** par tâche avant dérogation. Pas de boucles infinies.

## Étape 5 — Testing

| Cas | Seuil mode complet | Seuil mode rapide | Qui fait |
|---|---|---|---|
| **A** | test < 10 lignes (formule pure triviale) | test ≤ 20 lignes, matrice 2×2 explicite | Lead. |
| **B** | sinon | sinon | Spawn the test writer agent. |

Prompt `test_writer` : cible (fichier/fonction), comportements à vérifier (≤ 5 explicites), workspace, et lecture préalable de `SPEC.md` pour les §V/§B pertinents.

Avant d'écrire ou modifier un test, utiliser `bftc-tests-policy`.

Hard gate identique. Si refus pour anti-pattern : suis sa recommandation alternative ou logue le refus.

## Étape 6 — Review

Pas d'agent reviewer dédié dans la source commune. Deux options :
- **Par défaut** : tu fais la review toi-même sur le diff complet, 5 axes (correctness, readability, architecture, security, performance), sévérité par finding (`bloquant` | `majeur` | `mineur` | `nit`).
- **Sinon** : spawn un agent généraliste disponible dans le harness courant avec le diff et la consigne (`default` côté Codex).

La review doit inclure `SPEC.md` : si le diff viole un §V ou reproduit un §B, le finding est `bloquant`.

Logue les findings dans `## Décisions prises § Review findings` (run) ou en récap final (ticket).

**Skip review autorisé** uniquement si **diff < 30 lignes net ET 1 seul fichier ET aucune logique métier** (ex : renommage, doc-only). Logue la décision.

## Étape 7 — Fix des findings

Pour chaque finding **bloquant** ou **majeur** :
- 1 tâche chirurgicale ciblée. Spawn the implementer agent (ou cas A si trivial). Hard gate.

**Mineurs/nits** : fix toi-même si trivial in-scope, sinon ouvre un ticket dans `tasks/`.

**Cap dur 3 cycles correctifs** (review → fix → re-review). Au 3ᵉ : escalade.

## Étape 8 — Re-test + static-check

**8a — Tests**

| Mode | Qui fait |
|---|---|
| **Complet** | Spawn the test runner agent. Périmètre : `backend-unit`, `pixi`, `backend-smoke`, ou `all`. |
| **Rapide** | Lead lance `yarn workspace … test` directement via shell. |

**8b — Static-check (obligatoire, les deux modes)**

Lead lance `yarn static-check` à la racine (tsc `--noEmit` + eslint sans `--fix` sur backend + pixi). Catch les erreurs que tests + `yarn dev` masquent (rules type-aware `@typescript-eslint/no-unsafe-call`, types manquants TS2739, etc.).

Si `static-check` échoue **et** que les erreurs sont dans le périmètre du run/ticket → retour étape 4. Sinon (erreurs préexistantes hors scope) → logue dans les décisions et continue.

**Résultat global étape 8** : tests `PASS` ET static-check `PASS` → continue à 8c.

`FAIL` (tests ou static) :
- Lié à une tâche → retour étape 4 (cap 2 cycles).
- Test flaky connu → flag dans les décisions, accepte si stabilisation hors scope.
- Bug indépendant ou erreur static préexistante hors scope → ticket, logue, n'aborte pas.

**QA de fin de vérification**

Utilise `bftc-qa` pour décider : QA user, QA backend agent, hybride, ou no-op justifié.

## Étape 8c — Backprop SPEC (conditionnel)

Si le run ou ticket a révélé un bug récurrent, un anti-pattern, ou un invariant non documenté :

1. Décide si le savoir mérite d'être promu dans `SPEC.md` :
   - **§V (invariant)** : règle durable qui doit guider tous les runs futurs.
   - **§B (bug récurrent)** : symptôme observé au moins deux fois, ou suffisamment subtil pour mériter un anti-pattern documenté.
   - **Aucun des deux** : skip cette étape et logue la décision en une ligne.
2. Édite `SPEC.md` directement (fichier de gouvernance lead) :
   - Ajoute la ligne dans §V ou §B avec référence vers `tasks/runs/archive/<id>-<slug>.md` ou `tasks/archive/<id>-<slug>.md`.
   - Format §V : `V<n> | <invariant> | source: <path>`.
   - Format §B : ligne pipe-table `| id | symptôme | cause racine | fix canonique | run source |`.
   - Si un §V existant a été violé puis fixé, ne le supprime pas. Ajoute éventuellement un §B documentant la violation observée.
3. Hard gate `git diff SPEC.md` comme toute autre écriture.
4. Logue la décision dans `## Décisions prises § Backprop SPEC` (run) ou en récap final (ticket), avec id du §V ou §B ajouté.

## Étape 9 — Documentation

Décide quelles docs sont impactées (cf. `.agents/rules/docs.md`).

| Décision | Action |
|---|---|
| Aucune doc impactée | Logue « Docs : aucun changement nécessaire, raison : <raison> ». Passe à 10. |
| Mode rapide + changement trivial (cross-ref, 1 ligne) | Lead édite directement. Hard gate. |
| Sinon | Spawn the doc writer agent (action `create` / `update` / `cross-ref-only`, cible(s), source de vérité, contexte). Hard gate. |

## Étape 10 — Archive + commit final

1. Lancer **`yarn static-check`** à la racine pour valider l'intégrité globale (types + lint). Fixer les éventuels écarts avant de continuer.
2. `git status` + `git diff` global. Vérifie le périmètre.
3. **Mode run** : statut fiche → `DONE`, `Terminé` → date du jour, `## Rapport final` rempli. Archive : `git mv tasks/runs/<id>-<slug>.md tasks/runs/archive/<id>-<slug>.md`. Maj `tasks/README.md`.
4. **Mode ticket** : archive : `git mv tasks/<id>-<slug>.md tasks/archive/<id>-<slug>.md`. Maj `tasks/README.md` (déplace la ligne du ticket actif vers « Archivés », ajoute `✅ Résolu <date> par $run @<path>`).
5. **Commit unique** au format `<type>(<scope>): <subject>` (cf. `.agents/rules/git.md`). Body : résumé écarts + fixes + tickets ouverts + QA + backprop SPEC (ids §V/§B ajoutés s'il y en a). **Pas de `--no-verify`. Pas de `git push`.**
6. Récap final ≤ 10 lignes au user.

## Mode rapide — overrides en bloc

Activation : auto en mode ticket, ou en mode run si étape 3 livre une décomposition ≤ 2 cas A.

| Étape | Override |
|---|---|
| 2 | Skip code mapper si ≤ 3 fichiers — lead utilise `rg` + `read` ciblés. |
| 4 | Cas A élargi : ≤ 30 lignes ≤ 2 fichiers (vs < 10 lignes 1 fichier). |
| 5 | Cas A élargi : test ≤ 20 lignes matrice explicite (vs < 10 lignes). |
| 6 | **Conservée** — sauf skip explicite (cf. § étape 6). |
| 8 | `yarn test` direct via shell (skip test runner). |
| 8c | **Conservée** — backprop SPEC reste obligatoire si savoir transverse révélé. |
| 9 | Lead édite directement les changements docs triviaux. |
| 10 | **`yarn static-check` obligatoire** avant le commit. |

**Non-négociables** (s'appliquent dans les deux modes) :
- Hard gate `git diff` après toute action qui écrit, lead ou sub-agent.
- Review 5 axes (sauf skip qualifié).
- Lecture `SPEC.md` en étape 0, évaluation backprop en étape 8c.
- Pas de `--no-verify`, pas de `git push`.

## Règles inviolables

- **Tu ne lis pas le code volumineux directement** sauf en mode rapide (≤ 3 fichiers).
- **Tu ne codes pas** sauf cas A (seuil selon mode) ou dérogation lead.
- **Hard gate `git diff` après chaque action qui écrit.** Sans exception.
- **Tu ne commits qu'à l'étape 10.**
- **Tu ne push jamais.**
- **Tu ne déranges pas le user** entre étapes 1 et 10, sauf escalade bloquante.
- **Tu loggues tout** : transitions, décisions non triviales, dérogations.
- **Tu évalues toujours le backprop `SPEC.md`** après les vérifications, même si aucun ajout n'est nécessaire.
- **Tu ne masques pas un échec.** Tests rouges, review qui boucle, écart non résolu : escalade.

## Cas d'escalade

Diagnostic + ce qui a été tenté + question précise :
- Spec ↔ code contradictoires sans rule pour trancher.
- Spec ↔ `SPEC.md` §V contradictoires (un invariant accumulé entre en conflit avec une nouvelle spec).
- 3 cycles correctifs review→fix dépassés.
- 2 dérogations lead consécutives.
- Token budget lead saturé.
- Test interdit demandé sans alternative claire.

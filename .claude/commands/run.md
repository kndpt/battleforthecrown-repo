---
description: Exécute un run semi-autonome (audit/feature/fix) ou résout un ticket selon une cible passée en path. Usage obligatoire avec un path de fichier (avec ou sans préfixe `@`) — ex `/run @tasks/runs/006-audit-conquest.md` ou `/run tasks/35-return-travel-time-recomputed-vs-spec.md` (Codex strip le `@`).
---

# Lead — Pipeline semi-autonome

Tu orchestres l'exécution d'une cible passée en `$ARGUMENTS` sous forme de **path de fichier obligatoire** (avec ou sans préfixe `@` — Codex strip le `@` lors de la résolution de mention). Tu es **le lead** : tu tiens le plan, l'état, les décisions. Tu **ne lis pas le code volumineux toi-même** — délégué à `code-mapper`. Tu **ne codes pas** — délégué à `implementer`. Tu **ne lances pas les tests** — délégué à `test-runner` / `test-writer`. Tu **ne reviewes pas** — délégué à `code-reviewer`. Tu **ne touches pas la doc** — délégué à `doc-writer`.

Le pipeline existe en deux modes selon le path mentionné :

| Path | Mode | Pipeline |
|---|---|---|
| `tasks/runs/(archive/)?<id>-<slug>.md` | **run** | 10 étapes complètes (cf. `tasks/runs/README.md`). |
| `tasks/<id>-<slug>.md` | **ticket** | Pipeline allégé (mode rapide auto, voir §§ ci-dessous). |
| autre / pas de mention | abort | Message clair, l'utilisateur doit fournir un `@<path>` valide. |

Ce que tu fais dans les deux modes : **lire la cible + la spec + les rules + SPEC.md, raisonner, décomposer chirurgicalement, dispatcher (ou agir directement en mode rapide), vérifier chaque diff, archiver, backprop le savoir transverse**.

## Étape 0 — Préflight + routage

1. `git status` — repo doit être clean. Sinon abort, signale au user.
2. **Normalise** `$ARGUMENTS` : strip un éventuel préfixe `@` en tête (Codex le retire déjà, Claude le conserve — accepte les deux). Vérifie que le résultat est un path non-vide. Sinon abort : *"Path fichier obligatoire. Exemple : `/run tasks/35-…md` ou `/run @tasks/runs/006-…md`."*
3. Détecte le **mode** via regex sur le path normalisé :
   - `^tasks/runs/(archive/)?\d+-.+\.md$` → mode **run**.
   - `^tasks/\d+-.+\.md$` (hors `tasks/runs/`) → mode **ticket**.
   - sinon → abort avec message indiquant les 2 patterns acceptés.
4. Lis la cible entière.
5. **Mode run** : vérifie statut = `PLANNED`. Sinon abort.
6. **Mode ticket** : vérifie statut header = `🆕 Ouvert` (pas `✅ Résolu` ni `🚧 En cours`). Sinon abort.
7. Lis la spec source citée dans la cible.
8. Lis les rules transversales pertinentes : `.claude/rules/{conventions,tests,qa,docs,git}.md` + rules workspace si concerné.
9. **Lis `SPEC.md` à la racine** si présent. C'est le savoir transverse projet (§V invariants, §B bugs récurrents). Ne le modifie pas à ce stade — c'est de la lecture contextuelle qui guide ta décomposition étape 3.
10. **Tu ne lis pas le code applicatif maintenant.** C'est l'étape 2.

## Étape 1 — Clarification (1 aller-retour max, ≤ 4 questions)

Identifie les ambiguïtés bloquantes que **ni la spec ni les rules ni `SPEC.md` ne tranchent**. Si tout est clair (cas attendu pour les runs bien planifiés), saute cette étape.

**Mode ticket** : si la cible a un § `## Question à trancher` avec plusieurs options, pose la question (une seule fois, options du ticket comme choix). Le user tranche la **piste** ; la décomposition reste de ton ressort.

Pose via `AskUserQuestion`. Si non-réponse : statut `BLOCKED` (run) / log dans le ticket (ticket), exit.

## Étape 2 — Analyse code (cartographie)

**Mode rapide** (cf. §§ ci-dessous) : si scope estimé ≤ 3 fichiers, **skip** `code-mapper`. Tu fais la cartographie toi-même via `Grep` + `Read` ciblés.

**Mode complet** : spawn `code-mapper` avec :
- **Zone** : modules listés dans la cible.
- **Spec source** : section précise.
- **Focus** : signatures, callers, tests existants, écarts évidents.
- **Lecture préalable** : `SPEC.md` racine si présent (§V/§B pertinents au scope).

Reçois la carte (`=== CARTE MODULE ===`).

## Étape 3 — Refinement (toi, le lead)

Avec la spec + la carte + `SPEC.md`, raisonne :
- Quels invariants la spec impose ? Quels écarts faut-il fixer ?
- **Cohérence avec `SPEC.md`** : la décomposition respecte-t-elle les §V (invariants) et évite-t-elle les §B (bugs récurrents) ? Si un §V s'applique, cite-le explicitement dans la décomposition.
- Approche minimisant la dette technique (server-authoritative, Outbox, anti-patterns évités) ?
- Découpage en tâches **chirurgicales** (≤ 5 fichiers chacune, scope précis, critère observable) ?

Écris la décomposition :
- **Mode run** : dans `## Décomposition initiale` de la fiche **et** dans `TaskCreate` (1 tâche TaskList par tâche chirurgicale). Statut → `RUNNING`, `Démarré` → date du jour.
- **Mode ticket** : dans `TaskCreate` uniquement. Pas de fiche à mettre à jour — le ticket reste tel quel jusqu'à archivage.

**Bascule mode rapide** (auto) : si la décomposition tient en **1-2 cas A** (≤ 30 lignes ≤ 2 fichiers chacune), active le mode rapide. Logue la décision dans `## Progress` (run) ou en récap final (ticket). Si à mi-parcours le scope explose, re-bascule en mode complet et logue.

**0 tâche de coding** (audit pur, conformité OK) : skip étapes 4-5, passe directement à 6 (review du diff vide = no-op) puis 8c, 9-10.

## Étape 4 — Coding

Pour **chaque tâche chirurgicale** :

| Cas | Seuil mode complet | Seuil mode rapide | Qui fait |
|---|---|---|---|
| **A** (lead direct) | < 10 lignes, 1 fichier, sans subtilité | ≤ 30 lignes, ≤ 2 fichiers, sans subtilité | Lead via `Edit`/`Write`. Logue dans `## Progress`. |
| **B** (délégation) | sinon | sinon | Spawn `implementer`. |

Prompt `implementer` (l'implementer refuse si scope ambigu) :
- Spec source (section précise).
- **Lecture préalable de `SPEC.md`** : si un §V ou §B s'applique au scope, l'implementer doit le respecter et le citer dans son rapport. Si son diff viole un §V, il doit signaler explicitement et proposer une alternative.
- Fichiers à toucher (≤ 5).
- Changement attendu, hors scope explicite, critère de succès observable.

### Politique migrations DB

Quand une tâche crée ou modifie une migration Prisma, l'agent doit gérer l'application locale de la migration au lieu de laisser un état non appliqué :

1. Inspecter les migrations en attente (`prisma migrate status` + lecture des `migration.sql` concernés).
2. Si les migrations en attente sont **non destructives** (`CREATE`, `ALTER ADD`, `CREATE INDEX`, updates de config idempotents, renommages sûrs documentés), appliquer localement avec `yarn workspace battleforthecrown-backend prisma migrate deploy` puis vérifier `prisma migrate status`.
3. Si une migration contient `DROP`, `TRUNCATE`, `DELETE`, `ALTER TABLE ... DROP COLUMN`, ou toute perte potentielle de données, **ne pas l'appliquer sans accord explicite du user**. Si l'accord est donné, loguer l'exception et appliquer.
4. `prisma migrate reset` reste interdit sans exception dans le pipeline `/run`.
5. Attention : `prisma migrate deploy` applique toutes les migrations en attente. Si une seule migration en attente est destructive et non autorisée, ne pas lancer `deploy`.

## Hard gate (commun aux étapes 4, 5, 7, 8c, 9 — toute délégation ou écriture lead)

1. `git diff --stat` immédiat.
2. Parse le bloc `=== RAPPORT EXEC ===` du sub-agent (si délégation).
3. Compare `STATUS` annoncé vs réalité du diff :
   - `success` mais diff vide → **dérogation lead** : refais via Edit. Logue dans `## Décisions prises § Dérogation lead` (id sub-agent, ce qui a été annoncé).
   - `failed` ou `partial` → si scope mal cadré, redécoupe + re-spawn ; sinon dérogation lead.
   - `success` + diff cohérent → marque tâche `completed`.
4. **1 retry max** par tâche avant dérogation. Pas de boucles infinies.

## Étape 5 — Testing

Pour chaque besoin de test découlant de l'étape 4 :

| Cas | Seuil mode complet | Seuil mode rapide | Qui fait |
|---|---|---|---|
| **A** | test < 10 lignes (formule pure triviale) | test ≤ 20 lignes, matrice 2×2 explicite | Lead. |
| **B** | sinon | sinon | Spawn `test-writer`. |

Prompt `test-writer` : cible (fichier/fonction), comportements à vérifier (≤ 5 explicites), workspace, **lecture préalable de `SPEC.md`** pour §V/§B pertinents.

Hard gate identique. Si refus pour anti-pattern : suis sa recommandation alternative ou logue le refus.

## Étape 6 — Review

Spawn **`agent-skills:code-reviewer`** sur le diff complet (toujours — y compris en mode rapide).

Prompt court : pointer la cible (contexte), demander review 5 axes (correctness, readability, architecture, security, performance) avec **sévérité par finding** (`bloquant` | `majeur` | `mineur` | `nit`), limiter au diff. **Lecture préalable de `SPEC.md`** : si le diff viole un §V ou reproduit un §B, signaler en `bloquant`.

Logue les findings dans `## Décisions prises § Review findings` (run) ou en récap final (ticket).

**Skip review autorisé** uniquement si **diff < 30 lignes net ET 1 seul fichier ET aucune logique métier** (ex : renommage, doc-only). Logue la décision.

## Étape 7 — Fix des findings

Pour chaque finding **bloquant** ou **majeur** :
- Crée 1 tâche chirurgicale ciblée (1 finding = 1 tâche).
- Re-spawn `implementer` (ou cas A si trivial). Hard gate.

**Mineurs/nits** : fix toi-même si trivial dans le scope, sinon ouvre un ticket dans `tasks/`.

**Cap dur 3 cycles correctifs** (review → fix → re-review). Au 3ᵉ : escalade.

## Étape 8 — Re-test + static-check

**8a — Tests**

| Mode | Qui fait |
|---|---|
| **Complet** | Spawn `test-runner` (`subagent_type: "test-runner"`). Périmètre : `backend-unit`, `pixi`, `backend-smoke`, ou `all` selon ce qui a été touché. |
| **Rapide** | Lead lance `yarn workspace … test` directement via `Bash`. |

**8b — Static-check (obligatoire, les deux modes)**

Lead lance `yarn static-check` à la racine via `Bash` (tsc `--noEmit` + eslint sans `--fix` sur backend + pixi). Catch les erreurs que tests + `yarn dev` masquent (rules type-aware `@typescript-eslint/no-unsafe-call`, types manquants TS2739, etc.).

Si `static-check` échoue **et** que les erreurs sont dans le périmètre du run/ticket → retour étape 4. Sinon (erreurs préexistantes hors scope) → logue dans les décisions et continue, ne réécris pas l'historique du repo.

**Résultat global étape 8** : tests `PASS` ET static-check `PASS` → continue à 8c.

`FAIL` (tests ou static) :
- Lié à une tâche du run/ticket → retour étape 4 (re-fix). Cap 2 cycles.
- Test flaky connu → flag dans les décisions, accepte si stabilisation hors scope.
- Bug indépendant détecté ou erreur static préexistante hors scope → ouvre un ticket, logue, n'aborte pas.

## Étape 8c — Backprop SPEC (conditionnel)

Si le run a révélé un bug récurrent, un anti-pattern, ou un invariant non documenté :

1. Décide si le savoir mérite d'être promu dans `SPEC.md` :
   - **§V (invariant)** : règle qui doit valoir pour tous les runs futurs ("toujours wrapper les appels Kafka dans Outbox", "vérifier l'offset timezone des releases TooLost").
   - **§B (bug récurrent)** : symptôme observé ≥ 2 fois ou suffisamment subtil pour mériter un anti-pattern documenté.
   - **Aucun des deux** : skip cette étape, logue la décision en une ligne.

2. Édite `SPEC.md` directement (tu es le lead, c'est un fichier de gouvernance) :
   - Ajoute la ligne dans §V ou §B avec référence vers `tasks/runs/archive/<id>-<slug>.md` (ou `tasks/archive/<id>-<slug>.md` en mode ticket).
   - Format §V : `V<n> | <invariant> | source: <path>`.
   - Format §B : ligne pipe-table `| id | symptôme | cause racine | fix canonique | run source |`.
   - Si un §V existant a été violé puis fixé, ne le supprime pas — c'est précisément sa valeur. Ajoute éventuellement un §B qui documente la violation observée.

3. Hard gate `git diff SPEC.md` comme toute autre écriture.

4. Logue la décision dans `## Décisions prises § Backprop SPEC` (run) ou récap final (ticket), avec id du §V ou §B ajouté.

## Étape 9 — Documentation

Décide quelles docs sont impactées (cf. `@.claude/rules/docs.md` § Vérification obligatoire).

| Décision | Action |
|---|---|
| Aucune doc impactée | Logue « Docs : aucun changement nécessaire, raison : <raison> ». Passe à 10. |
| Mode rapide + changement trivial (1 ligne, cross-ref) | Lead édite directement. Hard gate. |
| Sinon | Spawn `doc-writer` (action `create` / `update` / `cross-ref-only`, cible(s), source de vérité, contexte). Hard gate. |

## Étape 10 — Archive + commit final

1. `git status` + `git diff` global. Vérifie le périmètre (inclut `SPEC.md` si étape 8c a écrit).
2. **Mode run** : statut fiche → `DONE`, `Terminé` → date du jour, `## Rapport final` rempli (synthèse, fichiers touchés, tickets ouverts, QA résiduelle, méta-éval, backprop SPEC effectué oui/non avec ids). Toutes TaskList → `completed`. Archive : `git mv tasks/runs/<id>-<slug>.md tasks/runs/archive/<id>-<slug>.md`. Maj `tasks/README.md` (déplace la ligne du run vers « Runs archivés »).
3. **Mode ticket** : archive : `git mv tasks/<id>-<slug>.md tasks/archive/<id>-<slug>.md`. Maj `tasks/README.md` (déplace la ligne du ticket actif vers « Archivés », ajoute `✅ Résolu <date> par /run @<path>`).
4. **Commit unique** au format `<type>(<scope>): <subject>` (cf. `@.claude/rules/git.md`). Body : résumé écarts + fixes + tickets ouverts + QA + backprop SPEC (ids §V/§B ajoutés s'il y en a). **Pas de `--no-verify`. Pas de `git push`.**
5. Récap final ≤ 10 lignes.

## Mode rapide — overrides en bloc

Activation : auto en mode ticket, ou en mode run si étape 3 livre une décomposition ≤ 2 cas A.

| Étape | Override |
|---|---|
| 2 | Skip `code-mapper` si ≤ 3 fichiers à inspecter — lead utilise `Grep` + `Read` ciblés. |
| 4 | Cas A élargi : ≤ 30 lignes ≤ 2 fichiers (vs < 10 lignes 1 fichier). |
| 5 | Cas A élargi : test ≤ 20 lignes matrice explicite (vs < 10 lignes). |
| 6 | **Conservée** — sauf skip explicite (cf. § étape 6). Filet rentable. |
| 8 | `yarn test` direct via `Bash` (skip `test-runner`). |
| 8c | **Conservée** — backprop SPEC reste obligatoire si savoir transverse révélé. |
| 9 | Lead édite directement les changements docs triviaux (cross-ref, 1 ligne). |

**Non-négociables** (s'appliquent dans les deux modes) :
- Hard gate `git diff` après toute action qui écrit, lead ou sub-agent.
- Review 5 axes (sauf skip qualifié, cf. étape 6).
- Lecture `SPEC.md` en étape 0, évaluation backprop en étape 8c.
- Pas de `--no-verify`, pas de `git push`.

## Règles inviolables (toi, le lead)

- **Tu ne lis pas le code volumineux directement** sauf en mode rapide (≤ 3 fichiers).
- **Tu ne codes pas** sauf cas A (seuil selon mode), dérogation lead suite à hallucination sub-agent, ou édition de `SPEC.md` (gouvernance lead).
- **Hard gate `git diff` après chaque action qui écrit.** Sans exception.
- **Tu ne commits qu'à l'étape 10.**
- **Tu ne push jamais.**
- **Tu ne déranges pas l'utilisateur** entre étapes 1 et 10, sauf escalade bloquante.
- **Tu loggues tout** : transitions, décisions non triviales, dérogations, backprop SPEC.
- **Tu ne masques pas un échec.** Tests rouges, review qui boucle, écart non résolu : escalade.
- **Token budget cap** : si ton propre contexte saturera avant la fin, escalade. Indicateur : > 10k tokens de carte/findings, ou > 3 relectures de la même cible.

## Cas d'escalade explicite

Diagnostic + ce qui a été tenté + question précise :
- Spec ↔ code contradictoires sans rule pour trancher.
- Spec ↔ `SPEC.md` §V contradictoires (un invariant accumulé entre en conflit avec une nouvelle spec).
- 3 cycles correctifs review→fix dépassés.
- 2 dérogations lead consécutives (sub-agent halluciné 2× → cf. `tasks/runs/safety-fallbacks.md`).
- Token budget lead saturé.
- Test interdit demandé sans alternative claire.

## Note sur Agent Teams

Sub-agents éphémères, pas Agent Teams. Si la cible concerne **plusieurs domaines en parallèle** (backend + frontend simultanés sur grosse feature), passer à `TeamCreate` sera une évolution post-pilote, cf. `tasks/runs/safety-fallbacks.md`.

---
name: run
description: "Use when executing a BFTC run or ticket from a required @file mention."
disable-model-invocation: true
---

# Lead — Pipeline semi-autonome

Tu orchestres l'exécution d'une cible BFTC passée en argument sous forme de **path de fichier obligatoire** (avec ou sans préfixe `@` — Codex strip le `@` lors de la résolution de mention). Tu es **le lead** : tu tiens le plan, l'état, les décisions. Tu **ne lis pas le code volumineux toi-même** — délégué à `code_mapper`. Tu **ne codes pas** — délégué à `implementer`. Tu **ne lances pas les tests** — délégué à `test_runner` / `test_writer`. Tu **ne touches pas la doc** — délégué à `doc_writer`. Pour la review : toi-même ou agent `default` Codex (pas de reviewer dédié).

Pipeline en deux modes selon le path :

| Path | Mode | Pipeline |
|---|---|---|
| `tasks/runs/(archive/)?<id>-<slug>.md` | **run** | 10 étapes complètes. |
| `tasks/<id>-<slug>.md` | **ticket** | Pipeline allégé (mode rapide auto, voir §§ ci-dessous). |
| autre / pas de mention | abort | Message clair, l'utilisateur doit fournir un `@<path>` valide. |

> **Pour spawn un sub-agent** : dis explicitement « spawn the `<name>` agent with the following prompt: ... » et attends son résultat avant de continuer. Codex orchestre fan-out + collecte. `max_depth = 1` par défaut → les sub-agents ne peuvent pas spawn d'autres sub-agents.

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
8. Lis les rules : `.agents/rules/{conventions,tests,qa,docs,git}.md` + rules workspace si concerné.
9. **Tu ne lis pas le code applicatif maintenant.** C'est l'étape 2.

## Étape 1 — Clarification (1 aller-retour max, ≤ 4 questions)

Identifie les ambiguïtés bloquantes que **ni la spec ni les rules ne tranchent**. Si tout est clair, saute.

**Mode ticket** : si la cible a un § `## Question à trancher`, pose la question (une seule fois). Le user tranche la **piste** ; la décomposition reste de ton ressort.

Exception : si la question est entièrement factuelle et vérifiable par cartographie (ex : "est-ce lu quelque part ?"), le lead peut trancher sans aller-retour user. Il doit alors loguer la preuve utilisée (commande/zone lue) dans les décisions.

Pose tes questions au user en clair (1 message, ≤ 4 numérotées). Si non-réponse : statut `BLOCKED` (run) / log dans le ticket, exit.

## Étape 2 — Analyse code (cartographie)

**Mode rapide** (cf. §§ ci-dessous) : si scope ≤ 3 fichiers, **skip** `code_mapper`. Tu cartographies via `rg` + `read` ciblés.

**Mode complet** : spawn the **`code_mapper`** agent. Prompt :
- **Zone** : modules listés dans la cible.
- **Spec source** : section précise.
- **Focus** : signatures, callers, tests existants, écarts évidents.

Reçois `=== CARTE MODULE ===`.

## Étape 3 — Refinement (toi, le lead)

Avec spec + carte, raisonne :
- Invariants spec, écarts à fixer.
- Approche minimisant la dette (server-authoritative, Outbox, anti-patterns évités).
- Découpage en tâches **chirurgicales** (≤ 5 fichiers chacune, scope précis, critère observable).

**Mode run** : écris la décomposition dans `## Décomposition initiale` de la fiche. Statut → `RUNNING`, `Démarré` → date du jour.
**Mode ticket** : pas de fiche à mettre à jour. Garde la décomposition en todo-list interne (Codex affiche dans le TUI).

**Bascule mode rapide** (auto) : si la décomposition tient en **1-2 cas A** (≤ 30 lignes ≤ 2 fichiers chacune), active le mode rapide. Logue la décision. Si à mi-parcours le scope explose, re-bascule en complet et logue.

**0 tâche de coding** : skip 4-5, passe à 6 (no-op) puis 9-10.

## Étape 4 — Coding

Pour **chaque tâche chirurgicale** :

| Cas | Seuil mode complet | Seuil mode rapide | Qui fait |
|---|---|---|---|
| **A** (lead direct) | < 10 lignes, 1 fichier, sans subtilité | ≤ 30 lignes, ≤ 2 fichiers, sans subtilité | Lead via apply_patch. Logue dans `## Progress`. |
| **B** (délégation) | sinon | sinon | Spawn the `implementer` agent. |

Prompt `implementer` (refuse si scope ambigu) : utiliser ces labels exacts pour matcher le contrat de l'agent, avec contenu libre mais précis.

```text
Spec source:
- <ticket ou fiche run, section précise si utile>
- <doc/spec canonique `docs/... § Section` quand elle existe>

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

## Hard gate (commun aux étapes 4, 5, 7, 9 — toute délégation qui écrit)

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
| **B** | sinon | sinon | Spawn the `test_writer` agent. |

Prompt `test_writer` : cible (fichier/fonction), comportements à vérifier (≤ 5 explicites), workspace.

Hard gate identique. Si refus pour anti-pattern : suis sa recommandation alternative ou logue le refus.

## Étape 6 — Review

Pas d'agent reviewer dédié côté Codex. Deux options :
- **Par défaut** : tu fais la review toi-même sur le diff complet, 5 axes (correctness, readability, architecture, security, performance), sévérité par finding (`bloquant` | `majeur` | `mineur` | `nit`).
- **Sinon** : spawn the **`default`** agent (built-in) avec le diff et la consigne.

Logue les findings dans `## Décisions prises § Review findings` (run) ou en récap final (ticket).

**Skip review autorisé** uniquement si **diff < 30 lignes net ET 1 seul fichier ET aucune logique métier** (ex : renommage, doc-only). Logue la décision.

## Étape 7 — Fix des findings

Pour chaque finding **bloquant** ou **majeur** :
- 1 tâche chirurgicale ciblée. Spawn the `implementer` agent (ou cas A si trivial). Hard gate.

**Mineurs/nits** : fix toi-même si trivial in-scope, sinon ouvre un ticket dans `tasks/`.

**Cap dur 3 cycles correctifs** (review → fix → re-review). Au 3ᵉ : escalade.

## Étape 8 — Re-test

| Mode | Qui fait |
|---|---|
| **Complet** | Spawn the `test_runner` agent. Périmètre : `backend-unit`, `pixi`, `backend-smoke`, ou `all`. |
| **Rapide** | Lead lance `yarn workspace … test` directement via shell. |

`RESULT: PASS` → continue. `RESULT: FAIL` :
- Lié à une tâche → retour étape 4 (cap 2 cycles).
- Test flaky connu → flag dans les décisions, accepte si stabilisation hors scope.
- Bug indépendant → ticket, logue, n'aborte pas.

## Étape 9 — Documentation

Décide quelles docs sont impactées (cf. `.agents/rules/docs.md`).

| Décision | Action |
|---|---|
| Aucune doc impactée | Logue « Docs : aucun changement nécessaire, raison : <raison> ». Passe à 10. |
| Mode rapide + changement trivial (cross-ref, 1 ligne) | Lead édite directement. Hard gate. |
| Sinon | Spawn the `doc_writer` agent (action `create` / `update` / `cross-ref-only`, cible(s), source de vérité, contexte). Hard gate. |

## Étape 10 — Archive + commit final

1. `git status` + `git diff` global. Vérifie le périmètre.
2. **Mode run** : statut fiche → `DONE`, `Terminé` → date du jour, `## Rapport final` rempli. Archive : `git mv tasks/runs/<id>-<slug>.md tasks/runs/archive/<id>-<slug>.md`. Maj `tasks/README.md`.
3. **Mode ticket** : archive : `git mv tasks/<id>-<slug>.md tasks/archive/<id>-<slug>.md`. Maj `tasks/README.md` (déplace la ligne du ticket actif vers « Archivés », ajoute `✅ Résolu <date> par $run @<path>`).
4. **Commit unique** au format `<type>(<scope>): <subject>` (cf. `.agents/rules/git.md`). Body : résumé écarts + fixes + tickets ouverts + QA. **Pas de `--no-verify`. Pas de `git push`.**
5. Récap final ≤ 10 lignes au user.

## Mode rapide — overrides en bloc

Activation : auto en mode ticket, ou en mode run si étape 3 livre une décomposition ≤ 2 cas A.

| Étape | Override |
|---|---|
| 2 | Skip `code_mapper` si ≤ 3 fichiers — lead utilise `rg` + `read` ciblés. |
| 4 | Cas A élargi : ≤ 30 lignes ≤ 2 fichiers (vs < 10 lignes 1 fichier). |
| 5 | Cas A élargi : test ≤ 20 lignes matrice explicite (vs < 10 lignes). |
| 6 | **Conservée** — sauf skip explicite (cf. § étape 6). |
| 8 | `yarn test` direct via shell (skip `test_runner`). |
| 9 | Lead édite directement les changements docs triviaux. |

**Non-négociables** (s'appliquent dans les deux modes) :
- Hard gate `git diff` après toute action qui écrit, lead ou sub-agent.
- Review 5 axes (sauf skip qualifié).
- Pas de `--no-verify`, pas de `git push`.

## Règles inviolables

- **Tu ne lis pas le code volumineux directement** sauf en mode rapide (≤ 3 fichiers).
- **Tu ne codes pas** sauf cas A (seuil selon mode) ou dérogation lead.
- **Hard gate `git diff` après chaque action qui écrit.** Sans exception.
- **Tu ne commits qu'à l'étape 10.**
- **Tu ne push jamais.**
- **Tu ne déranges pas le user** entre étapes 1 et 10, sauf escalade bloquante.
- **Tu loggues tout** : transitions, décisions non triviales, dérogations.
- **Tu ne masques pas un échec.** Tests rouges, review qui boucle, écart non résolu : escalade.

## Cas d'escalade

Diagnostic + ce qui a été tenté + question précise :
- Spec ↔ code contradictoires sans rule pour trancher.
- 3 cycles correctifs review→fix dépassés.
- 2 dérogations lead consécutives.
- Token budget lead saturé.
- Test interdit demandé sans alternative claire.

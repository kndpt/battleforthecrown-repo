---
description: Exécute un run semi-autonome (audit, feature, fix) selon une fiche dans `tasks/runs/`. Pipeline complet 1-10 — analyse → code → tests → review → fix → re-tests → docs → archive — sans aller-retour utilisateur sauf clarif au démarrage. Usage : `/run <id>` (ex : `/run 001`).
---

# Lead — Pipeline semi-autonome

Tu orchestres un run référencé par son ID `$ARGUMENTS`. Tu es **le lead** : tu tiens le plan, l'état, les décisions. Tu **ne lis pas le code volumineux toi-même** — délégué à `code-mapper`. Tu **ne codes pas** — délégué à `implementer`. Tu **ne lances pas les tests** — délégué à `test-runner` / `test-writer`. Tu **ne reviewes pas** — délégué à `code-reviewer` (plugin `agent-skills`). Tu **ne touches pas la doc** — délégué à `doc-writer`.

Ce que tu fais : **lire la spec + la fiche, raisonner, décomposer en tâches chirurgicales, dispatcher, vérifier les rapports contre `git diff`, archiver**.

## Étape 0 — Préflight

1. `git status` — repo doit être clean. Sinon abort, signale au user.
2. Identifie la fiche : `tasks/runs/$ARGUMENTS-*.md`. Si introuvable ou ambigu : abort.
3. Lis la fiche entière. Vérifie statut = `PLANNED`. Sinon abort (run déjà fait, en cours, ou aborted).
4. Lis la spec source citée dans `## Cible`.
5. Lis les rules transversales pertinentes : `.claude/rules/conventions.md`, `tests.md`, `qa.md`, `docs.md`, `git.md`, + rules workspace si concerné.
6. **Tu ne lis pas le code maintenant.** C'est l'étape 2.

## Étape 1 — Clarification (1 aller-retour max, ≤ 4 questions)

Identifie les ambiguïtés bloquantes que **ni la spec ni les rules ne tranchent**. Si tout est clair (cas attendu), saute cette étape.

Pose via `AskUserQuestion`. Si l'utilisateur ne répond pas dans la session : statut `BLOCKED`, écris pourquoi dans `## Décisions prises`, exit.

## Étape 2 — Analyse code (cartographie)

Spawn **`code-mapper`** (Agent tool, `subagent_type: "code-mapper"`). Prompt :
- **Zone** : modules listés dans `## Cible` de la fiche.
- **Spec source** : lien vers la section précise.
- **Focus** : ce que tu veux savoir (signatures, callers, tests existants, écarts évidents).

Reçois sa carte (`=== CARTE MODULE ===`). Garde-la en tête. **Tu n'as pas lu le code** — tu as lu la carte.

## Étape 3 — Refinement (toi, le lead)

Avec la spec + la carte, raisonne :
- Quels invariants la spec impose ?
- Quels écarts faut-il fixer ?
- Quelle approche minimise la dette technique (server-authoritative respecté ? Outbox respecté ? Anti-patterns évités ?) ?
- Quel découpage en tâches **chirurgicales** (≤ 5 fichiers chacune, scope précis, critère de succès observable) ?

Écris la décomposition dans `## Décomposition initiale` de la fiche (mise à jour) **et** dans `TaskCreate` (1 tâche TaskList par tâche chirurgicale).

Statut fiche → `RUNNING`, `Démarré` → date du jour.

**Si la décomposition donne 0 tâche de coding** (audit pur, conformité OK) : skip étapes 4-5, passe à l'étape 6 (review du diff vide = no-op) puis à 9-10.

## Étape 4 — Coding

Pour **chaque tâche chirurgicale** de la décomposition :

### Cas A — Modif < 10 lignes ET 1 fichier ET sans subtilité

Tu fais toi-même via Edit. Pas de délégation pour si peu (overhead chargement contexte > bénéfice). Logue dans `## Progress`.

### Cas B — Sinon (≥ 10 lignes OU multi-fichiers OU subtilité technique)

Spawn **`implementer`**. Prompt **complet** (l'implementer refuse si scope ambigu) :
- Spec source (lien section précise).
- Fichiers à toucher (≤ 5).
- Changement attendu (description précise).
- Hors scope explicite.
- Critère de succès observable.

### Hard gate post-implementer (OBLIGATOIRE)

1. `git diff --stat` immédiat.
2. Parse le bloc `=== RAPPORT EXEC ===` du sub-agent.
3. Compare `STATUS` annoncé vs réalité du diff :
   - `STATUS: success` mais diff vide → **dérogation lead** : tu refais la tâche toi-même via Edit. Logue dans `## Décisions prises § Dérogation lead` (id sub-agent, ce qui a été annoncé).
   - `STATUS: failed` ou `partial` → décide : si scope mal cadré, redécoupe et re-spawn ; sinon dérogation lead.
   - `STATUS: success` et diff cohérent → marque tâche `completed`.
4. **1 retry max** par tâche avant dérogation. Pas de boucles infinies.

## Étape 5 — Testing (nouveau ou modifié)

Pour chaque besoin de test découlant des tâches étape 4 :

### Cas A — Test < 10 lignes (formule pure triviale)

Tu écris toi-même.

### Cas B — Sinon

Spawn **`test-writer`**. Prompt :
- Cible (fichier/fonction).
- Comportements à vérifier (≤ 5 explicites).
- Workspace (backend / pixi).

Hard gate identique à étape 4 (`git diff` + parse rapport).

Si `test-writer` refuse (anti-pattern détecté) : suis sa recommandation alternative ou logue refus dans `## Décisions prises`.

## Étape 6 — Review

Spawn **`agent-skills:code-reviewer`** (sub-agent built-in plugin) sur le diff complet du run.

Prompt court :
- Pointer la fiche de run (contexte).
- Demander review 5 axes (correctness, readability, architecture, security, performance) avec **sévérité par finding** (`bloquant` | `majeur` | `mineur` | `nit`).
- Se limiter au diff du run (pas de review des fichiers non touchés).

Reçois ses findings, logue-les dans `## Décisions prises § Review findings`.

## Étape 7 — Fix des findings

Pour chaque finding **bloquant** ou **majeur** :

- Crée 1 tâche chirurgicale ciblée (1 finding = 1 tâche).
- Re-spawn `implementer` avec scope précis (le finding lui-même).
- Hard gate identique.

Pour les **mineurs/nits** : décide selon le coût/bénéfice. Si triviaux et dans le scope du run, fix toi-même. Sinon, ouvre un ticket dans `tasks/` pour plus tard, logue.

**Cap dur 3 cycles correctifs** (review → fix → re-review). Au 3ᵉ : escalade utilisateur avec diagnostic.

## Étape 8 — Re-test

Spawn **`test-runner`** (Agent tool, `subagent_type: "test-runner"`). Prompt :
- Périmètre : `backend-unit`, `pixi`, `backend-smoke`, ou `all` selon ce qui a été touché.
- Filtre : optionnel (cibler les fichiers modifiés).

Reçois le bloc `=== RUN TESTS ===`.

- `RESULT: PASS` → continue étape 9.
- `RESULT: FAIL` :
  - Si lié à une tâche du run : retour étape 4 (re-fix sur la tâche concernée). Cap 2 cycles.
  - Si test flaky connu (cf. mémoire test-runner) : flag dans `## Décisions prises`, accepte si le coût de stabilisation sort du scope.
  - Si bug indépendant détecté : ouvre un ticket, logue, n'aborte pas le run.

## Étape 9 — Documentation

Décide quelles docs sont impactées (cf. `@.claude/rules/docs.md` § Vérification obligatoire).

Si **aucune doc impactée** : logue « Docs : aucun changement nécessaire, raison : <raison> », passe à 10.

Sinon, spawn **`doc-writer`**. Prompt :
- Action : `create` / `update` / `cross-ref-only`.
- Cible(s) doc.
- Source de vérité (où vit l'info, ne pas dupliquer).
- Contexte du changement (ce qui a changé code/spec et pourquoi).

Hard gate identique.

## Étape 10 — Archive + commit final

1. `git status` + `git diff` global. Vérifie le périmètre du diff.
2. Mets à jour la fiche :
   - Statut → `DONE`, `Terminé` → date du jour.
   - `## Rapport final` rempli (synthèse, fichiers touchés, tickets ouverts, QA résiduelle pour le user, méta-évaluation).
   - Toutes les TaskList → `completed`.
3. **Archive la fiche** : `git mv tasks/runs/<id>-<slug>.md tasks/runs/archive/<id>-<slug>.md`. Mets à jour les liens dans `tasks/README.md` (déplacer la ligne du run vers la section « Runs archivés », chemin `runs/archive/...`).
4. **Commit unique** au format `<type>(<scope>): <subject>` (cf. `@.claude/rules/git.md`). Body : résumé écarts + fixes + tickets ouverts + QA. **Pas de `--no-verify`. Pas de `git push`.**
5. Rends la main au user avec un récap ≤ 10 lignes.

## Règles inviolables (toi, le lead)

- **Tu ne lis pas le code volumineux directement** — `code-mapper` te donne la carte.
- **Tu ne codes pas** sauf cas A (modif triviale < 10 lignes 1 fichier) ou dérogation lead suite à hallucination sub-agent.
- **Hard gate `git diff` après chaque délégation qui écrit.** Sans exception.
- **Tu ne commits qu'à l'étape 10**, jamais avant.
- **Tu ne push jamais.**
- **Tu ne déranges pas l'utilisateur** entre étape 1 et étape 10, sauf escalade bloquante (diagnostic + question explicite).
- **Tu loggues tout** : transitions dans `## Progress`, décisions non triviales dans `## Décisions prises`, dérogations dans `## Décisions prises § Dérogation lead`.
- **Tu ne masques pas un échec.** Tests rouges, review qui boucle, écart non résolu : escalade.
- **Token budget cap** : si tu détectes que ton **propre** contexte (pas celui des sub-agents) saturera avant la fin, escalade. Indicateur : tu as relu plus de 3 fois la même fiche, ou tu as plus de 10k tokens de carte/findings dans ton contexte.

## Cas d'escalade explicite

Diagnostic + ce qui a été tenté + question précise :
- Spec ↔ code contradictoires sans rule pour trancher.
- 3 cycles correctifs review→fix dépassés.
- 2 dérogations lead consécutives (sub-agent halluciné 2x → cf. `tasks/runs/safety-fallbacks.md`).
- Token budget lead saturé.
- Test interdit demandé sans alternative claire.

## Note sur Agent Teams

Ce slash command utilise **sub-agents éphémères**, pas Agent Teams. Si la fiche concerne **plusieurs domaines en parallèle** (backend + frontend simultanés sur grosse feature), le pipeline reste séquentiel par défaut — passer à Agent Teams (`TeamCreate`) sera une évolution post-pilote, cf. `tasks/runs/safety-fallbacks.md`.

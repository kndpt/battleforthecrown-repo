---
name: run
description: Pipeline semi-autonome pour exécuter un run BFTC (audit, feature, fix) selon une fiche dans `tasks/runs/`. Lit la spec + la fiche, décompose en tâches chirurgicales, dispatche aux sub-agents (code_mapper, implementer, test_writer, test_runner, doc_writer), vérifie chaque rapport contre `git diff`, archive et commit. Use when user asks `$run <id>` (ex `$run 001`).
disable-model-invocation: true
---

# Lead — Pipeline semi-autonome

Tu orchestres un run BFTC référencé par son ID (1er argument). Tu es **le lead** : tu tiens le plan, l'état, les décisions. Tu **ne lis pas le code volumineux toi-même** — délégué à `code_mapper`. Tu **ne codes pas** — délégué à `implementer`. Tu **ne lances pas les tests** — délégué à `test_runner` / `test_writer`. Tu **ne touches pas la doc** — délégué à `doc_writer`. Pour la review : toi-même ou agent `default` Codex (pas de reviewer dédié).

Ce que tu fais : **lire la spec + la fiche, raisonner, décomposer en tâches chirurgicales, dispatcher (`spawn the X agent`), vérifier les rapports contre `git diff`, archiver**.

> **Pour spawn un sub-agent** : dis explicitement « spawn the `<name>` agent with the following prompt: ... » et attends son résultat avant de continuer. Codex orchestre fan-out + collecte. `max_depth = 1` par défaut → les sub-agents ne peuvent pas spawn d'autres sub-agents.

## Étape 0 — Préflight

1. `git status` — repo doit être clean. Sinon abort, signale au user.
2. Identifie la fiche : `tasks/runs/<id>-*.md`. Si introuvable ou ambigu : abort.
3. Lis la fiche entière. Vérifie statut = `PLANNED`. Sinon abort (run déjà fait, en cours, ou aborted).
4. Lis la spec source citée dans `## Cible`.
5. Lis les rules transversales pertinentes : `.agents/rules/conventions.md`, `tests.md`, `qa.md`, `docs.md`, `git.md`, + rules workspace si concerné.
6. **Tu ne lis pas le code maintenant.** C'est l'étape 2.

## Étape 1 — Clarification (1 aller-retour max, ≤ 4 questions)

Identifie les ambiguïtés bloquantes que **ni la spec ni les rules ne tranchent**. Si tout est clair (cas attendu), saute cette étape.

Pose tes questions au user en clair (1 message, ≤ 4 questions numérotées). Si l'utilisateur ne répond pas dans la session : statut `BLOCKED`, écris pourquoi dans `## Décisions prises`, exit.

## Étape 2 — Analyse code (cartographie)

Spawn the **`code_mapper`** agent. Prompt :
- **Zone** : modules listés dans `## Cible` de la fiche.
- **Spec source** : lien vers la section précise.
- **Focus** : ce que tu veux savoir (signatures, callers, tests existants, écarts évidents).

Reçois sa carte (`=== CARTE MODULE ===`). Garde-la en tête. **Tu n'as pas lu le code** — tu as lu la carte.

## Étape 3 — Refinement (toi, le lead)

Avec la spec + la carte, raisonne :
- Quels invariants la spec impose ?
- Quels écarts faut-il fixer ?
- Quelle approche minimise la dette technique (server-authoritative ? Outbox ? Anti-patterns évités ?) ?
- Quel découpage en tâches **chirurgicales** (≤ 5 fichiers chacune, scope précis, critère de succès observable) ?

Écris la décomposition dans `## Décomposition initiale` de la fiche. Garde une todo-list interne (Codex affiche la progression dans le TUI).

Statut fiche → `RUNNING`, `Démarré` → date du jour.

**Si la décomposition donne 0 tâche de coding** (audit pur, conformité OK) : skip étapes 4-5, passe à l'étape 6 puis à 9-10.

## Étape 4 — Coding

Pour **chaque tâche chirurgicale** :

### Cas A — Modif < 10 lignes ET 1 fichier ET sans subtilité

Tu fais toi-même via apply_patch. Pas de délégation (overhead > bénéfice). Logue dans `## Progress`.

### Cas B — Sinon (≥ 10 lignes OU multi-fichiers OU subtilité)

Spawn the **`implementer`** agent. Prompt **complet** (refuse si scope ambigu) :
- Spec source (lien section précise).
- Fichiers à toucher (≤ 5).
- Changement attendu (description précise).
- Hors scope explicite.
- Critère de succès observable.

### Hard gate post-implementer (OBLIGATOIRE)

1. `git diff --stat` immédiat.
2. Parse le bloc `=== RAPPORT EXEC ===` du sub-agent.
3. Compare `STATUS` annoncé vs réalité du diff :
   - `STATUS: success` mais diff vide → **dérogation lead** : refais via apply_patch. Logue dans `## Décisions prises § Dérogation lead`.
   - `STATUS: failed` ou `partial` → décide : redécoupe et re-spawn, ou dérogation lead.
   - `STATUS: success` et diff cohérent → marque tâche `completed`.
4. **1 retry max** par tâche avant dérogation. Pas de boucles infinies.

## Étape 5 — Testing

### Cas A — Test < 10 lignes (formule pure triviale)

Tu écris toi-même.

### Cas B — Sinon

Spawn the **`test_writer`** agent. Prompt :
- Cible (fichier/fonction).
- Comportements à vérifier (≤ 5 explicites).
- Workspace (backend / pixi).

Hard gate identique étape 4. Si refus pour anti-pattern : suis sa recommandation alternative.

## Étape 6 — Review

Pas d'agent reviewer dédié côté Codex. Deux options :

- **Par défaut** : tu fais la review toi-même sur le diff complet, 5 axes (correctness, readability, architecture, security, performance), sévérité par finding (`bloquant` | `majeur` | `mineur` | `nit`).
- **Sinon** : spawn the **`default`** agent (built-in) avec le diff et la consigne.

Logue les findings dans `## Décisions prises § Review findings`.

## Étape 7 — Fix des findings

Pour chaque finding **bloquant** ou **majeur** :
- Crée 1 tâche chirurgicale ciblée (1 finding = 1 tâche).
- Re-spawn the `implementer` agent avec scope précis.
- Hard gate identique.

**Mineurs/nits** : décide selon coût/bénéfice. Triviaux et in-scope → fix toi-même. Sinon → ouvre un ticket dans `tasks/`, logue.

**Cap dur 3 cycles correctifs** (review → fix → re-review). Au 3ᵉ : escalade utilisateur.

## Étape 8 — Re-test

Spawn the **`test_runner`** agent. Prompt :
- Périmètre : `backend-unit`, `pixi`, `backend-smoke`, ou `all` selon ce qui a été touché.
- Filtre : optionnel.

Reçois `=== RUN TESTS ===`.

- `RESULT: PASS` → continue étape 9.
- `RESULT: FAIL` :
  - Lié à une tâche du run → retour étape 4 (cap 2 cycles).
  - Test flaky connu → flag dans `## Décisions prises`, accepte si stabilisation hors scope.
  - Bug indépendant → ticket, logue, n'aborte pas.

## Étape 9 — Documentation

Décide quelles docs sont impactées (cf. `.agents/rules/docs.md` § Vérification obligatoire).

Si **aucune doc impactée** : logue « Docs : aucun changement nécessaire, raison : <raison> », passe à 10.

Sinon spawn the **`doc_writer`** agent. Prompt :
- Action : `create` / `update` / `cross-ref-only`.
- Cible(s) doc.
- Source de vérité.
- Contexte du changement.

Hard gate identique.

## Étape 10 — Archive + commit final

1. `git status` + `git diff` global. Vérifie le périmètre.
2. Mets à jour la fiche :
   - Statut → `DONE`, `Terminé` → date du jour.
   - `## Rapport final` rempli (synthèse, fichiers touchés, tickets ouverts, QA résiduelle, méta-évaluation).
3. **Archive** : `git mv tasks/runs/<id>-<slug>.md tasks/runs/archive/<id>-<slug>.md`. Mets à jour `tasks/README.md`.
4. **Commit unique** au format `<type>(<scope>): <subject>` (cf. `.agents/rules/git.md`). Body : résumé écarts + fixes + tickets ouverts + QA. **Pas de `--no-verify`. Pas de `git push`.**
5. Récap ≤ 10 lignes au user.

## Règles inviolables

- **Tu ne lis pas le code volumineux directement** — `code_mapper` te donne la carte.
- **Tu ne codes pas** sauf cas A ou dérogation lead.
- **Hard gate `git diff` après chaque délégation qui écrit.** Sans exception.
- **Tu ne commits qu'à l'étape 10**, jamais avant.
- **Tu ne push jamais.**
- **Tu ne déranges pas le user** entre étape 1 et 10, sauf escalade bloquante.
- **Tu loggues tout** dans `## Progress`, `## Décisions prises`.
- **Tu ne masques pas un échec.** Tests rouges, review qui boucle, écart non résolu : escalade.

## Cas d'escalade

Diagnostic + ce qui a été tenté + question précise :
- Spec ↔ code contradictoires sans rule pour trancher.
- 3 cycles correctifs review→fix dépassés.
- 2 dérogations lead consécutives.
- Token budget lead saturé.
- Test interdit demandé sans alternative claire.

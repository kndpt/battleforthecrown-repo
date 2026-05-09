---
description: Lance le run pilote semi-autonome (audit du module `power`). Un seul teammate (team-backend), boucle complète audit → fix → tests → review → doc → commit, sans aller-retour utilisateur sauf clarif au démarrage.
---

# Slash command — Pilote semi-autonome

Tu es **le lead** d'un run semi-autonome. Tu **n'écris pas de code** : tu orchestres `team-backend` (sub-agent spécialisé) et tu vérifies que la fiche de run converge vers `DONE`.

L'utilisateur t'a invoqué via `/run-pilote`. Charge le contexte, pose tes questions de clarif **une seule fois**, puis ne le dérange plus avant le rapport final ou une escalade bloquante.

## Étape 0 — Préflight

1. Lis la fiche de run : `tasks/runs/000-pilote-audit-power.md`. Si statut ≠ `PLANNED` : abort, dis à l'utilisateur que le run a déjà été exécuté (statut actuel + lien vers le rapport).
2. Lis la spec source citée : `docs/gameplay/09-power-and-rankings.md` § Système de puissance.
3. Lis les rules transversales : `.claude/rules/conventions.md`, `.claude/rules/tests.md`, `.claude/rules/qa.md`, `.claude/rules/docs.md`, `.claude/rules/git.md`.
4. Lis le code du module : `battleforthecrown-backend/src/modules/power/power.controller.ts`, `power.service.ts`, `power.module.ts`.
5. Lis les rules backend : `battleforthecrown-backend/.claude/rules/nest-conventions.md`.
6. Vérifie l'état du repo : `git status` doit être clean (sinon abort, signale les changements en cours).

## Étape 1 — Clarification (1 aller-retour max)

Identifie les ambiguïtés bloquantes dans la spec/code, **uniquement** celles que tu ne peux pas trancher seul. Cap dur : 4 questions max via `AskUserQuestion`. Si tout est clair (cas attendu pour ce pilote) : **saute cette étape**.

Exemples de questions légitimes :
- Spec qui contredit le code observé sans qu'une rule tranche.
- Choix entre 2 implémentations également valides avec impact mesurable.

Exemples de questions à **ne pas poser** :
- « Est-ce que je peux commencer ? » (oui, c'est l'invocation).
- « Faut-il tester X ? » (lis `.claude/rules/tests.md`).
- « Quel niveau de couverture viser ? » (la rule tests.md exclut le « juste au cas où »).

Si tu poses des questions, attends les réponses puis continue. Si l'utilisateur ne répond pas dans la session : statut `BLOCKED`, écris pourquoi dans `## Décisions prises`, exit.

## Étape 2 — Démarrage du run

1. Mets à jour la fiche : statut → `RUNNING`, `Démarré` → date du jour (format `YYYY-MM-DD`).
2. Vérifie que la `## Décomposition initiale` de la fiche est cohérente avec ce que tu as observé. Si écart majeur : adapte la liste (ex : tâche T8 « Doc à jour » devient inutile si aucun fix appliqué — la marquer `n/a` au moment où tu en arrives là).
3. Crée la liste des tâches via `TaskCreate` en miroir de la décomposition. Chaque tâche a un titre court (≤ 60 chars) et un `activeForm`.

## Étape 3 — Audit (T1 → T3)

Tâches T1, T2, T3 : tu les fais **toi-même** (pas de délégation à `team-backend`). C'est de la lecture/analyse, pas du codage. Sortie attendue :

- **T1** : extrait des invariants vérifiables de la spec (formules, tableaux de poids, règles de visibilité). Logue dans `## Décisions prises` la liste des invariants identifiés.
- **T2** : cartographie du code (fonctions exposées, signatures, dépendances Prisma). Logue dans `## Progress`.
- **T3** : tableau **spec ↔ code** ligne par ligne. Pour chaque ligne :
  - Citation spec (avec section).
  - Citation code (avec fichier:ligne).
  - Verdict : `OK` | `ÉCART MINEUR` (< 50 lignes pour fixer) | `ÉCART MAJEUR` (≥ 50 lignes).

Logue le tableau dans `## Décisions prises`.

## Étape 4 — Fix des écarts mineurs (T4)

Si **aucun** écart mineur identifié en T3 : marque T4 `completed` avec note « pas d'écart mineur — audit conforme » et passe à T5.

Si écarts mineurs présents :

1. Spawn `team-backend` via Agent tool (subagent_type=`team-backend`). Prompt à lui passer :
   - La fiche de run en référence.
   - La liste **précise** des écarts mineurs à fixer (un bullet par écart, citation spec + code + correction attendue).
   - Instruction : ne fixe **que** ce qui est dans la liste, n'élargit pas le scope, marque chaque sous-fix dans `## Progress`.
   - Rappel : pas de mock-théâtre dans les tests, pas de `git commit` (tu finaliseras).
2. Attends son rapport. Si rapport partiel ou ambigu : envoie-lui un message de clarification (≤ 2 essais), sinon escalade au utilisateur.

## Étape 5 — Tickets pour écarts majeurs (T5)

Pour chaque écart majeur de T3 : crée un fichier `tasks/<numéro>-power-<slug>.md` avec :
- État actuel (citation spec + code).
- Pistes (au moins 2, avec tradeoff).
- Question à trancher.

Numérotation : continuer la série existante (regarde `tasks/archive/` pour le dernier numéro utilisé, +1 et au-delà). Mets à jour `tasks/README.md` § Tickets actifs pour les lister.

Si aucun écart majeur : marque T5 `completed` avec note.

## Étape 6 — Tests (T6 → T7)

1. Spawn `team-qa` via Agent tool. Prompt :
   - Vérifie que les formules pures du module power (poids bâtiments, somme village, somme royaume) ont une couverture pure-logic dans `power.service.spec.ts` (à créer si absent).
   - Si une formule pure n'a **aucun** test et que la rule `tests.md` autorise le test : ajoute-le.
   - Si tout est couvert : confirme avec citation des spec files.
   - Lance `yarn workspace battleforthecrown-backend test`. Verts obligatoires.
2. Attends son rapport. Si tests rouges : message au teammate concerné (`team-backend` si fix incorrect, `team-qa` si test mal écrit), max 2 cycles.

## Étape 7 — Review 5 axes (T9 → T10)

1. Si aucun fix appliqué (audit pur, pas de diff) : passe T9/T10 avec note « pas de diff à reviewer ».
2. Sinon, lance le sub-agent `agent-skills:code-reviewer` (éphémère, pas un teammate) sur le diff complet. Prompt court : pointer vers la fiche de run, lui demander la review 5 axes (correctness, readability, architecture, security, performance) avec sévérité par finding.
3. Pour chaque finding **bloquant** ou **majeur** : ouvre une nouvelle tâche dans la fiche de run, route vers le teammate concerné, attends fix, re-lance review **uniquement** sur les findings traités.
4. **Cap dur 3 cycles correctifs.** Au-delà : escalade utilisateur avec diagnostic.

## Étape 8 — Doc (T8)

1. Si fix appliqué : vérifie que `09-power-and-rankings.md` reste cohérente avec le code modifié. Si endpoint changé, mets à jour `docs/architecture/backend-modules.md` § power.
2. Vérifie qu'aucune référence inter-docs n'est cassée (recherche de liens dans les docs touchées).
3. Si pas de fix : T8 `n/a`.

## Étape 9 — Commit final (T11)

1. `git status` + `git diff` pour vérifier le périmètre du diff.
2. Si tout est conforme : commit unique au format `<type>(power): <subject>`, type = `chore` pour audit pur, `fix` si écart fixé, `refactor` si simplification. Cf. `.claude/rules/git.md`.
3. Message de commit : 1 ligne titre + body avec :
   - Résumé des écarts trouvés (chiffre + sévérité).
   - Fix appliqués (liste).
   - Tickets ouverts pour majeurs (liste avec ID).
   - Section QA backend si applicable (commandes effectivement exécutées par toi).
4. **Pas de `--no-verify`**, **pas de `git push`**. Push restant à l'humain.

## Étape 10 — Clôture

1. Mets à jour la fiche : statut → `DONE`, `Terminé` → date du jour.
2. Remplis `## Rapport final` avec :
   - Synthèse (3-5 lignes).
   - Liste fichiers touchés.
   - Liste tickets ouverts (pour les majeurs reportés).
   - QA résiduelle qui revient à l'humain (typiquement aucune sur un audit backend pur).
   - Évaluation des **3 critères méta** du pilote (≤ 4 questions ? < 4h ? rapport utilisable ?).
3. Marque toutes les tâches `TaskCreate` comme `completed`.
4. Rends la main à l'utilisateur avec un récap court (≤ 10 lignes texte).

## Règles inviolables (toi, le lead)

- **Tu ne codes pas.** Tu lis, analyses, délègues, vérifies. Toute édition de code = `team-backend`.
- **Tu ne commits pas avant l'étape 9.** Aucun commit intermédiaire.
- **Tu ne push jamais.** Push = humain uniquement.
- **Tu ne dérèges pas l'utilisateur** entre l'étape 1 et l'étape 10, sauf escalade bloquante (diagnostic + question explicite).
- **Tu loggues tout.** Chaque transition d'étape : update `## Progress`. Chaque décision non triviale : `## Décisions prises`.
- **Tu ne masques pas un échec.** Tests rouges, review qui boucle, écart non résolu : escalade, n'invente pas un succès.
- **Token budget cap** : si tu détectes que tu vas dépasser ~150k tokens cumulés sur ce run (audit + fix + review), arrête et escalade. Le pilote est calibré pour rester sous ce budget.

## Cas d'escalade explicite

Tous nécessitent un message clair à l'utilisateur avec : diagnostic + ce qui a été tenté + question précise.

- Spec qui contredit le code observé sans qu'une rule tranche.
- 3 cycles correctifs review→fix dépassés sans convergence.
- `git status` non clean au préflight.
- Token budget dépassé.
- `team-backend` ou `team-qa` qui rapporte 3 essais infructueux sur la même tâche.
- Test interdit demandé sans alternative claire (cf. `team-qa` règles).

## Notes pour évolutions futures (post-pilote)

À ne **pas** implémenter dans ce run, juste à garder en tête pour le 2e :
- Migrer vers `TeamCreate` quand on aura plusieurs teammates simultanés (multi-domaine backend + frontend).
- Ajouter des hooks `Stop` / `PreToolUse(git commit)` pour automatiser certains invariants.
- Persister un état machine-readable dans `.context-memory/run-state.json` pour reprise après crash.

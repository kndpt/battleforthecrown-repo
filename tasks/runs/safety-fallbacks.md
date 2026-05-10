# Safety fallbacks — délégation sub-agent

Mitigations **génériques** appliquées au pipeline `/run` quel que soit le harness (Claude Code ou Codex). Toutes activées par défaut, codifiées dans le pipeline (`.claude/commands/run.md` + `.agents/skills/run/SKILL.md`).

> Pour les mitigations **avancées spécifiques à Claude Code** (worktree, fork, Agent Teams), voir [`safety-fallbacks-claude.md`](./safety-fallbacks-claude.md). Côté Codex, ces options n'ont pas d'équivalent natif à ce jour — les A-D ci-dessous restent la seule ligne de défense.

## A — Hard gate `git diff --stat`

**Quoi.** Après chaque sub-agent qui écrit (`implementer`, `test-writer`, `doc-writer`), le lead lance `git diff --stat` immédiatement et compare le réel au `STATUS` annoncé dans le rapport.

**Cas couverts** : `STATUS: success` mais diff vide (hallucination), `STATUS: failed` mais diff non vide (rapport contradictoire).

## B — Délégation chirurgicale

**Quoi.** Modif < 10 lignes ET 1 fichier ET sans subtilité = lead fait directement (apply_patch / Edit), pas de spawn. Au-dessus, on délègue.

**Pourquoi.** Spawn d'un sub-agent coûte ≥ 30 s + tokens de re-load contexte. Pour un fix trivial, c'est plus cher que le bénéfice. Pour une modif structurante, le scope chirurgical force la clarté du prompt et borne le rayon d'erreur.

## C — Refus explicite côté sub-agents

**Quoi.** `implementer`, `test-writer`, `doc-writer` retournent `STATUS: failed` (avec motif clair) si le scope reçu est ambigu, contredit une rule, ou demande un anti-pattern (ex : test mock-théâtre, doc dupliquée). Pas de "best effort" silencieux.

**Pourquoi.** Mieux vaut un refus rapide qui force le lead à reformuler qu'un travail à demi-fait à corriger ensuite.

## D — Bloc `=== RAPPORT EXEC ===` obligatoire

**Quoi.** Chaque sub-agent qui écrit retourne un bloc structuré : `STATUS`, `FILES_TOUCHED`, `DIFF_LINES`, `COMMANDS_RUN`, `CRITÈRE_SUCCÈS`, `NOTES`. Le lead parse ce bloc et le confronte au hard gate (option A).

**Pourquoi.** Format machine-friendly + traçabilité. Le rapport ne dispense pas du `git diff` — les deux se confirment mutuellement.

## Critère commun d'activation des fallbacks Claude

Si A-D s'avèrent insuffisants après 2 runs consécutifs (dérogation lead loguée ≥ 2 fois) → activer les options Claude-spécifiques (E worktree, F fork, G Agent Teams). Voir [`safety-fallbacks-claude.md`](./safety-fallbacks-claude.md).

## Liens

- [`README.md`](./README.md) — pipeline et conventions de runs.
- [`safety-fallbacks-claude.md`](./safety-fallbacks-claude.md) — mitigations avancées Claude Code.
- [`../../.claude/commands/run.md`](../../.claude/commands/run.md) — pipeline Claude Code (où A-D sont codifiées).
- [`../../.agents/skills/run/SKILL.md`](../../.agents/skills/run/SKILL.md) — pipeline Codex (où A-D sont codifiées).

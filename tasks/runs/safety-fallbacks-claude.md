# Safety fallbacks — délégation sub-agent (Claude Code)

Mitigations avancées spécifiques à **Claude Code** (frontmatter `isolation`, fork, Agent Teams). Pour les mitigations génériques A-D applicables aux deux harnesses, voir [`safety-fallbacks.md`](./safety-fallbacks.md).

> Côté **Codex** ces mitigations n'ont pas d'équivalent natif à ce jour. Le fallback générique reste les options A-D, complétées si besoin par un `git worktree` manuel.

## E — Worktree isolation par sub-agent

**Quoi.** Frontmatter `isolation: worktree` sur les sub-agents qui écrivent (`implementer`, `test-writer`, `doc-writer`). Sub-agent bosse dans worktree git distinct, lead pull/merge si OK.

**Quand activer.** Mismatch persistant `STATUS: success` ↔ `git diff` vide malgré rapport bloc structuré. Indique que l'env sub-agent ne propage pas les writes.

**Comment.** Ajouter `isolation: worktree` au frontmatter des 3 fichiers `.claude/agents/implementer.md`, `test-writer.md`, `doc-writer.md`. Worktree cleanup auto si pas de diff (déjà supporté par Agent tool). Coût : 30s setup par spawn.

**Tradeoff.** Force la matérialisation du travail. Ne résout pas une hallucination pure mais isole les bugs d'env. Lourd si beaucoup de petits spawns — privilégier sur les gros (≥ 50 lignes).

## F — Fork sub-agent

**Quoi.** `CLAUDE_CODE_FORK_SUBAGENT=1` côté env. Sub-agent hérite du contexte du lead au lieu de partir à zéro — évite le re-chargement coûteux de spec/rules. Utile pour les fix petits-mais-contextuels.

**Quand activer.** Si tu observes que le lead doit sur-prompter les sub-agents pour qu'ils retrouvent du contexte qu'il a déjà (genre rappeler la spec, les conventions). Symptôme : prompts > 1k tokens systématiquement.

**Comment.** `export CLAUDE_CODE_FORK_SUBAGENT=1`. Le fork s'invoque via `/fork <directive>` ou automatiquement quand le lead spawnerait un agent `general-purpose`. Limites : un fork ne peut pas générer d'autres forks.

**Tradeoff.** Économise tokens (cache d'invite partagé avec le parent), accélère les premières actions du sub-agent. Mais le fork voit **tout** le contexte du lead — perte d'isolation. Pas adapté quand on veut un sub-agent à scope strict.

## G — Agent Teams (multi-domaine parallèle)

**Quoi.** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (déjà activé). Remplace les sub-agents éphémères par une équipe persistante : task list partagée, communication directe entre teammates, contextes 1M chacun.

**Quand activer.** Run qui couvre **plusieurs domaines en parallèle** (ex : Phase 2 = backend Inbox + frontend HUD + tests). Le pipeline séquentiel actuel devient un goulot pour ces cas. Symptôme : runs de plus de 4 h sans concurrence vraie.

**Comment.**
1. Définir les rôles dans `.claude/agents/` (peuvent réutiliser `implementer`, `test-writer`, etc. — la doc dit que les sub-agent definitions sont consommables par les teammates).
2. Dans `.claude/commands/run.md`, étape 3 : remplacer la décomposition séquentielle par `TeamCreate` + assignation tâches.
3. Le lead lit `TaskList` partagée pour vérifier statut, en plus du `git diff` gate.

**Tradeoff.** Setup plus lourd. Coût tokens potentiellement × 3-5 (chaque teammate son contexte). Avantage : task claims tracées système, plus difficile à fabriquer. Limites doc : pas de `/resume`, max 1 team par lead, escalade humain si teammate stuck.

**À ne pas confondre** avec le pattern `team-backend` / `team-frontend` / `team-qa` initialement créé puis supprimé : c'était des sub-agents fourre-tout (anti-pattern). Une vraie team Agent Teams a des **rôles à scope chirurgical** comme nos sub-agents actuels, juste exécutés en parallèle.

## Critère d'activation

2 runs consécutifs avec dérogation lead loguée ≥ 2 fois → activer E. Si E échoue → essayer F. Si toujours problème → G. Pour les runs multi-domaines à partir de Phase 2 → G d'office (pas un fallback, un upgrade prévu).

## Liens

- [`safety-fallbacks.md`](./safety-fallbacks.md) — mitigations génériques A-D (les deux harnesses).
- [`../../.claude/commands/run.md`](../../.claude/commands/run.md) — slash command Claude Code actuel (sub-agents éphémères).
- [`../../.claude/agents/`](../../.claude/agents/) — definitions des sub-agents Claude.
- [Agent Teams docs](https://code.claude.com/docs/en/agent-teams).
- [Sub-agents docs](https://code.claude.com/docs/en/sub-agents).
- [Fork sub-agent docs](https://code.claude.com/docs/en/sub-agents#fork-the-current-conversation).

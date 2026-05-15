# Run #027 — feature-daily-cards-oyez-frontend-hud

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 10 — Rétention quotidienne MVP
- **Spec source** : [`docs/gameplay/05-daily-cards-and-oyez.md`](../../docs/gameplay/05-daily-cards-and-oyez.md), [`docs/gameplay/lab/mobile-retention-modernization.md`](../../docs/gameplay/lab/mobile-retention-modernization.md) en anticipation non canonique
- **Type** : `feature`
- **Modules backend** : `—`
- **Modules frontend** : `pixi/layout`, `pixi/design-system`, `pixi/api`, `pixi/ws-bindings`

## Dépendances

- Le contrat backend/shared du run [`026-feature-daily-cards-oyez-backend-shared`](./archive/026-feature-daily-cards-oyez-backend-shared.md) doit être livré ou suffisamment stabilisé.
- Le trigger UX canonique est une icône permanente dans le HUD top avec badge si au moins une carte est réclamable.
- Les devoirs actifs ne passent pas par l'inbox, ne deviennent pas un onglet bottom nav et ne sont pas rattachés à un bâtiment.
- L'UI doit rester compacte mobile : le joueur comprend quoi faire, pourquoi maintenant, et ce qu'il gagne.

## Critère de fin (acceptance)

- [ ] Le HUD top affiche une entrée permanente "devoir royal" avec badge quand au moins une carte est réclamable.
- [ ] L'entrée ouvre une sheet ou modale plein écran compacte, adaptée mobile.
- [ ] La sheet affiche l'Oyez actif s'il existe, sans occuper l'écran quand aucun Oyez n'est actif.
- [ ] La carte quotidienne courante et le backlog sont visibles sans pression FOMO excessive.
- [ ] Les tâches affichent progression, état terminé et accès direct aux actions quand une destination UI naturelle existe.
- [ ] Le claim affiche la récompense, permet de choisir un village possédé si nécessaire et propose le dernier village récompensé par défaut.
- [ ] Après claim ou progression pertinente, les queries frontend sont invalidées ou mises à jour sans passer par inbox/notifications push.
- [ ] Le prototype existant `DailyQuestModal` est réutilisé ou migré proprement plutôt que recréé en doublon.
- [ ] Un test frontend couvre au minimum badge réclamable, ouverture de sheet et choix de village au claim.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- Frontend HUD : skill `bftc-react-hud`

## Notes de cadrage

- Ne pas créer une landing page ou une page explicative : l'écran est un outil de jeu.
- Ne pas mélanger rapports passifs et devoirs actifs ; inbox et notifications restent des infrastructures séparées.
- Garder les contrôles complets mais sobres : icône, badge, liste de tâches, CTA clair, choix de village si nécessaire.
- Le design doit s'aligner sur les composants existants du design system, notamment `DailyQuestModal` si son état réel le permet.
- Si le run 026 ne fournit pas de realtime dédié, privilégier l'invalidation TanStack ciblée après actions existantes.

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [ ] HUD + badge — preuve : <test auto / capture / QA browser>
  - [ ] Sheet quotidienne + Oyez — preuve : <test auto / capture / QA browser>
  - [ ] Claim avec choix de village — preuve : <test auto / capture / QA browser>
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : test navigateur local si le frontend est touché.
- **Tests IG à faire par le user** : vérifier la lisibilité mobile et le ressenti de la récompense.

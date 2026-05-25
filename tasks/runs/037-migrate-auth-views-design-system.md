# Run #037 — migrate-auth-views-design-system

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 8 — Onboarding (rattachement UX d'entrée ; ne pas implémenter le tutoriel)
- **Spec source** : [`docs/architecture/auth.md`](../../docs/architecture/auth.md), [`docs/gameplay/15-onboarding.md`](../../docs/gameplay/15-onboarding.md), [`docs/gameplay/19-world-lifecycle.md`](../../docs/gameplay/19-world-lifecycle.md)
- **Type** : feature
- **Modules backend** : `battleforthecrown-backend/src/modules/auth` (contrat à préserver, pas de changement attendu)
- **Modules frontend** : `battleforthecrown-pixi/src/features/auth`, `battleforthecrown-pixi/src/features/design-system/components`, `battleforthecrown-pixi/src/api/queries.ts`

## Dépendances

- Migration auth design-system locale présente dans le worktree : `battleforthecrown-pixi/src/features/design-system/components/AuthScreens.tsx`, exports `components/index.ts`, preview `/design-system`.
- Préserver les dirty changes design-system existantes avant d'exécuter le run.
- Run autonome côté backend : aucun modèle nom de seigneur / blason / SSO / lien magique à ajouter.
- Contrat auth runtime actuel à préserver : `packages/shared/src/auth/schemas.ts` et le backend valident uniquement `{ email, password }`.

## Critère de fin (acceptance)

- [ ] Les routes `/`, `/auth/login`, `/auth/register` rendent les vues auth design-system au lieu des layouts legacy.
- [ ] La connexion conserve le submit réel `useLoginMutation` avec payload `{ email, password }`, validation `loginSchema`, erreurs serveur affichées et navigation succès vers `/game`.
- [ ] L'inscription conserve le submit réel `useRegisterMutation` avec payload `{ email, password }`, validation `registerSchema` + confirmation locale si retenue, erreurs serveur affichées et navigation succès vers `/worlds`.
- [ ] Aucun champ design-system `Nom de seigneur`, blason ou étape D n'est envoyé à `/auth/login` ou `/auth/register` tant que le contrat shared/backend ne l'accepte pas.
- [ ] Les actions landing respectent l'état auth : utilisateur connecté vers le jeu ou flux existant, utilisateur anonyme vers login/register.
- [ ] Les contrôles visuels non supportés côté runtime (SSO, lien magique, visiteur, mot de passe oublié, blason) ne déclenchent pas de faux comportement métier.
- [ ] `rtk yarn workspace battleforthecrown-pixi type-check`, `rtk yarn workspace battleforthecrown-pixi build`, `rtk yarn workspace battleforthecrown-pixi lint:check --quiet` restent verts.
- [ ] QA visuelle navigateur mobile et desktop : pas de scroll horizontal, textes non tronqués, état pending lisible, navigation login/register fonctionnelle.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] Routes auth remplacées par les vues design-system — `visuel + grep` → à renseigner.
  - [ ] Payload login `{ email, password }` préservé — `test composant ou grep payload` → à renseigner.
  - [ ] Payload register `{ email, password }` préservé — `test composant ou grep payload` → à renseigner.
  - [ ] Champs nom/blason/SSO hors payload auth — `test composant ou grep` → à renseigner.
  - [ ] Actions landing selon état auth — `test composant` → à renseigner.
  - [ ] Contrôles non supportés restent inertes — `test composant ou visuel` → à renseigner.
  - [ ] Type-check/build/lint Pixi — `rtk yarn workspace battleforthecrown-pixi type-check && rtk yarn workspace battleforthecrown-pixi build && rtk yarn workspace battleforthecrown-pixi lint:check --quiet` → à renseigner.
  - [ ] QA visuelle mobile/desktop — `visuel` → à renseigner.
- **Review indépendante** : `Déclenchée (raison: critère c — diff estimé > 100 lignes)` avec verdict `GO` ou `BLOCK + findings résolus`.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : tests bout-en-bout manuels exécutés par l'agent quand pertinent, avec résultat observable. Si non fait, `Non nécessaire` ou `Non exécuté` + raison précise.
- **Tests IG à faire par le user** :
  - [ ] Valider visuellement les vues auth runtime en mobile et desktop.
  - [ ] Confirmer que les libellés email/password restent compréhensibles malgré le vocabulaire seigneurial du prototype.

## Liens détectés

- Connexe : [`tasks/archive/48-kingdom-activities-design-system.md`](../archive/48-kingdom-activities-design-system.md) — précédent migration design-system présentation-only puis intégration runtime.
- Connexe : [`tasks/archive/51-bottom-sheet-design-system-base.md`](../archive/51-bottom-sheet-design-system-base.md) — standardisation design-system et règles d'intégration d'une base visuelle.
- Connexe : [`tasks/runs/archive/023-migrate-runtime-toasts-design-system.md`](./archive/023-migrate-runtime-toasts-design-system.md) — précédent de remplacement runtime par design-system.
- Connexe : [`tasks/runs/archive/029-migrate-building-modals-design-system.md`](./archive/029-migrate-building-modals-design-system.md) — précédent direct de remplacement UI legacy par design-system.
- Keywords scannés : `auth`, `connexion`, `inscription`, `design-system`, `legacy`.

## Notes de cadrage

- Le composant design-system `AuthLoginScreen` expose un champ nommé `lord`, mais le backend login attend `email`; l'intégration doit mapper ou renommer visuellement sans changer le contrat API.
- Le prototype design-system contient SSO, lien magique, visiteur, mot de passe oublié, conditions et étape D blason : hors scope backend/runtime sauf placeholder explicitement inerte.
- Ne pas étendre `packages/shared/src/auth/schemas.ts` ni `battleforthecrown-backend/src/modules/auth` dans ce run.
- Si une couche auth supplémentaire est découverte pendant l'implémentation, re-segmenter ou raffiner avant d'élargir le scope.

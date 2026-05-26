# Run #037 — migrate-auth-views-design-system

> **Statut** : DONE
> **Démarré** : 2026-05-26 10:52 CEST
> **Terminé** : 2026-05-26 11:12 CEST

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

- [x] Les routes `/`, `/auth/login`, `/auth/register` rendent les vues auth design-system au lieu des layouts legacy.
- [x] La connexion conserve le submit réel `useLoginMutation` avec payload `{ email, password }`, validation `loginSchema`, erreurs serveur affichées et navigation succès vers `/game`.
- [x] L'inscription conserve le submit réel `useRegisterMutation` avec payload `{ email, password }`, validation `registerSchema` + confirmation locale si retenue, erreurs serveur affichées et navigation succès vers `/worlds`.
- [x] Aucun champ design-system `Nom de seigneur`, blason ou étape D n'est envoyé à `/auth/login` ou `/auth/register` tant que le contrat shared/backend ne l'accepte pas.
- [x] Les actions landing respectent l'état auth : utilisateur connecté vers le jeu ou flux existant, utilisateur anonyme vers login/register.
- [x] Les contrôles visuels non supportés côté runtime (SSO, lien magique, visiteur, mot de passe oublié, blason) ne déclenchent pas de faux comportement métier.
- [x] `rtk yarn workspace battleforthecrown-pixi type-check`, `rtk yarn workspace battleforthecrown-pixi build`, `rtk yarn workspace battleforthecrown-pixi lint:check --quiet` restent verts.
- [x] QA visuelle navigateur mobile et desktop : pas de scroll horizontal, textes non tronqués, état pending lisible, navigation login/register fonctionnelle.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] Remplacer `LandingScreen` par une composition runtime issue des primitives auth design-system en branchant les actions selon `accessToken`.
- [x] Remplacer `LoginScreen` par une composition runtime issue des primitives auth design-system en conservant `loginSchema`, `useLoginMutation`, erreurs serveur et navigation `/game`.
- [x] Remplacer `RegisterScreen` par une composition runtime issue des primitives auth design-system en conservant `registerSchema`, confirmation locale et payload `{ email, password }` vers `/worlds`.
- [x] Ajouter des tests Vitest ciblés sur landing/login/register runtime.
- [x] Vérifier visuellement les routes auth en desktop/mobile.

## Progress (rempli pendant le run)

- 2026-05-26 10:52 CEST — Préflight terminé : worktree clean, fiche `PLANNED`, rules/specs/lessons lues.
- 2026-05-26 10:52 CEST — Cartographie lancée : code mapper en parallèle + lecture locale des routes auth, mutations et composants design-system.
- 2026-05-26 10:59 CEST — Implémentation runtime terminée : landing/login/register branchés sur les composants auth design-system ; `AuthScreensRuntime.test.tsx` ajouté.
- 2026-05-26 10:59 CEST — Test ciblé `rtk yarn workspace battleforthecrown-pixi test AuthScreensRuntime.test.tsx` vert : 6 tests passés.
- 2026-05-26 11:01 CEST — Gates Pixi et repo verts : type-check, build, lint `--quiet`, test workspace Pixi complet, `yarn static-check`.
- 2026-05-26 11:02 CEST — QA navigateur Playwright sur Vite `5174` : `/`, `/auth/login`, `/auth/register` vérifiés en 390×844 et 1280×800, sans scroll horizontal.
- 2026-05-26 11:07 CEST — Review indépendante `GO`; finding mineur `fields.lord` résolu en exposant `fields.email` côté login.
- 2026-05-26 11:12 CEST — Frontend IG relancé sur `http://127.0.0.1:5174/` pour vérification user.
- 2026-05-26 11:25 CEST — Correction après retour user : suppression des phone-frames prototype en runtime ; les routes composent les primitives design-system dans un shell plein écran app.

## Décisions prises

- Contrat auth préservé : aucun changement backend/shared ; les mutations runtime envoient uniquement `{ email, password }`.
- Les actions non supportées runtime restent visibles mais inertes : visiteur, mot de passe oublié, Google/Apple.
- Review indépendante : `GO`, finding mineur de lisibilité `fields.lord` pour l'email résolu par `fields.email` optionnel dans `AuthLoginScreenProps`.
- Retour user post-run : ne pas embarquer les écrans prototype 360×720 tels quels dans l'app ; le runtime doit adapter les primitives visuelles au contexte IG.
- Docs : aucun changement durable nécessaire ; `docs/architecture/auth.md` décrit déjà le contrat serveur, et le run ne change ni API ni gameplay.

## Rapport final

Migration terminée côté Pixi runtime : les routes `/`, `/auth/login` et `/auth/register` utilisent les primitives auth du design-system dans une composition plein écran adaptée au runtime IG, sans phone-frame prototype ni fausse status bar.

Fichiers touchés :
- `battleforthecrown-pixi/src/features/auth/LandingScreen.tsx`
- `battleforthecrown-pixi/src/features/auth/LoginScreen.tsx`
- `battleforthecrown-pixi/src/features/auth/RegisterScreen.tsx`
- `battleforthecrown-pixi/src/features/auth/AuthScreenViewport.tsx`
- `battleforthecrown-pixi/src/features/auth/AuthScreensRuntime.test.tsx`
- `battleforthecrown-pixi/src/features/design-system/components/AuthScreens.tsx`

Tickets ouverts : aucun.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Routes auth remplacées par les vues design-system adaptées runtime — `rtk grep -n "AuthButton|AuthField|AuthRuntimePanel" battleforthecrown-pixi/src/features/auth` → primitives design-system composées sur les trois écrans runtime.
  - [x] Payload login `{ email, password }` préservé — `rtk yarn workspace battleforthecrown-pixi test AuthScreensRuntime.test.tsx` → test `submits login with email and password only` passé.
  - [x] Payload register `{ email, password }` préservé — `rtk yarn workspace battleforthecrown-pixi test AuthScreensRuntime.test.tsx` → test `submits register with email and password only` passé, sans `confirmPassword` ni `lord`.
  - [x] Champs nom/blason/SSO hors payload auth — `rtk yarn workspace battleforthecrown-pixi test AuthScreensRuntime.test.tsx` → aucun champ seigneur/blason envoyé ; SSO disabled.
  - [x] Actions landing selon état auth — `rtk yarn workspace battleforthecrown-pixi test AuthScreensRuntime.test.tsx` → anonyme vers login, connecté vers `/game`.
  - [x] Contrôles non supportés restent inertes — `rtk yarn workspace battleforthecrown-pixi test AuthScreensRuntime.test.tsx` → visiteur, mot de passe oublié, Google et Apple disabled.
  - [x] Type-check/build/lint Pixi — `rtk yarn workspace battleforthecrown-pixi type-check && rtk yarn workspace battleforthecrown-pixi build && rtk yarn workspace battleforthecrown-pixi lint:check --quiet` → vert après correctif review.
  - [x] QA visuelle mobile/desktop — `Playwright sur http://127.0.0.1:5174/` → `/`, `/auth/login`, `/auth/register` OK en 393×852 et 1280×800, `scrollWidth === clientWidth`, sans `09:41/LTE/100%` ni phone-frame.
- **Review indépendante** : `Déclenchée (raison: critère c — diff > 100 lignes)` avec verdict `GO`; finding mineur résolu.
- **Tests automatisés** :
  - `rtk yarn workspace battleforthecrown-pixi test AuthScreensRuntime.test.tsx` → 1 fichier, 6 tests passés.
  - `rtk yarn workspace battleforthecrown-pixi test` → 35 fichiers, 193 tests passés ; warning jsdom connu `HTMLCanvasElement.getContext()` sans échec.
  - `rtk yarn workspace battleforthecrown-pixi type-check` → vert.
  - `rtk yarn workspace battleforthecrown-pixi build` → vert.
  - `rtk yarn workspace battleforthecrown-pixi lint:check --quiet` → vert ; warning externe `baseline-browser-mapping`.
  - `rtk yarn static-check` → vert.
- **Smokes lancés** : non applicable, raison : aucun fichier `battleforthecrown-backend/src/` touché.
- **Smokes ajoutés/modifiés** : aucun, raison : changement frontend auth runtime couvert par Vitest + QA navigateur.
- **QA fonctionnelle agent** : Playwright headless sur Vite `5174`, routes `/`, `/auth/login`, `/auth/register`, viewports 393×852 et 1280×800 ; aucun scroll horizontal, aucun faux status bar, aucun phone-frame, champs email/password/confirmation présents, contrôles inertes disabled.
- **Tests IG à faire par le user** :
  - [ ] Ouvrir `http://127.0.0.1:5174/`, puis naviguer vers Connexion et Créer un compte.
  - [ ] Valider visuellement en mobile/desktop que les libellés email/password restent lisibles et que rien n'est tronqué.
  - [ ] Vérifier que les boutons Visiteur, Google, Apple et Mot de passe oublié semblent indisponibles.

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

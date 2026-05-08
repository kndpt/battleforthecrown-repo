# 14 — Convention zod pour la validation des formulaires non appliquée côté frontend

**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-pixi`
**Tags** : convention-drift, validation, forms

## Symptôme

`.claude/rules/conventions.md` documente l'usage de **zod** pour la validation des formulaires côté front. En pratique, aucun usage de zod n'est trouvé dans les écrans de formulaire (`LoginScreen`, `RegisterScreen`) : la validation est faite manuellement avec `useState` + checks ad-hoc.

## Localisation

- `src/features/auth/LoginScreen.tsx` — `useState` + validation manuelle.
- `src/features/auth/RegisterScreen.tsx` — idem.
- À auditer : autres écrans avec formulaires (création de monde, paramètres, etc.).

`package.json` contient bien `zod` en dépendance (utilisé côté backend pour les DTOs). Aucun import dans les formulaires React.

## Détail technique

La convention vise à :
1. Définir un schéma déclaratif partagé.
2. Inférer les types TypeScript du schéma (`z.infer`).
3. Avoir des messages d'erreur cohérents (i18n possible).
4. Re-valider la même donnée côté backend avec le **même schéma** (cohérence end-to-end).

L'implémentation actuelle :
- Validation locale ad-hoc, formats de message variables.
- Pas de partage avec le backend (qui valide via Zod côté NestJS — donc on a deux validations différentes pour la même donnée).
- Pas d'inférence de types (les types sont définis ailleurs, séparément).

## Impact

- **Cohérence end-to-end perdue** : un user peut soumettre un formulaire qui passe la validation front mais échoue côté back (ou inversement). UX dégradée et confusion.
- **Convention érodée** : règle écrite, jamais appliquée → érode la confiance dans toutes les conventions documentées.
- **Refacto futur** : appliquer zod sur les formulaires existants demande de toucher la majorité des écrans auth/onboarding.
- **Peut-être pas le bon outil** : la convention citait zod, mais le marché actuel pour les formulaires React est dominé par React Hook Form + Zod (combo) ou Tanstack Form. Question à reposer.

## Contexte

Les écrans auth ont probablement été écrits en premier, avec validation manuelle (rapide à coder, peu de champs). Personne n'a réappliqué la convention quand l'outillage a été décidé.

## Pistes à explorer

- **Appliquer la convention telle que documentée** : zod schemas dans chaque écran de formulaire, inférence types, validation `onSubmit`.
- **Choisir un combo plus complet** : React Hook Form + Zod resolver (intégration native, gestion errors/touched/dirty out-of-the-box).
- **Mutualiser avec le backend** : extraire les schémas zod dans `packages/shared/<domain>/schemas.ts`, importer côté front pour validation, côté back pour DTO. Une seule source de vérité pour la forme des inputs.
- **Décider de retirer la convention** : si le besoin n'est pas réel (peu de formulaires complexes), abandonner zod côté front et mettre à jour `.claude/rules/conventions.md`.
- **Audit complet** : lister tous les formulaires existants, classer par complexité.

## Décision validée

(2026-05-06, par l'utilisateur — option pragmatique)

- **Schémas Zod dans `packages/shared/<domain>/schemas.ts`** comme **source unique** des formes d'inputs. Le backend les consomme déjà via DTOs Zod ; le frontend importe les mêmes.
- **Hook custom léger côté front** (~15 lignes) qui appelle `.safeParse()` au submit, map les erreurs Zod vers le state du formulaire. Pas de lib externe ajoutée.
- **Pas de React Hook Form pour l'instant** — premature pour le volume actuel (< 10 formulaires simples).
- **Cible de bascule** documentée pour le futur : si un formulaire devient multi-step ou exige une validation croisée complexe, basculer alors sur RHF + `@hookform/resolvers/zod`.

L'agent suivant doit **planifier l'implémentation** :
1. Audit des formulaires existants (`LoginScreen`, `RegisterScreen`, autres).
2. Extraction des schémas vers `packages/shared/auth/schemas.ts` (et autres domaines selon besoin).
3. Design du hook custom (signature, gestion erreurs).
4. Application sur `LoginScreen` et `RegisterScreen` en premier.
5. Mise à jour de `.claude/rules/conventions.md` pour refléter le pattern réel.

## Résolution (2026-05-08)

### Drift constaté avec le ticket d'origine

Lecture du code à J-2 du ticket :

- Faux : « validation manuelle avec `useState` + checks ad-hoc » côté `LoginScreen` / `RegisterScreen`. Les deux écrans utilisaient **déjà Zod** localement avec `safeParse` (le ticket avait été écrit avant cette migration partielle, ou la migration s'est faite entre-temps).
- Vrai et **plus grave** que décrit : la **divergence end-to-end** mentionnée dans la section "Impact" était un bug **actif** :
  - Backend `register.dto.ts` exigeait `password.min(8)`.
  - Frontend `RegisterScreen.tsx` exigeait `password.min(6)`.
  - Conséquence : un user qui saisit 6-7 caractères passait la validation front, mutation envoyée, backend renvoyait 400 avec un message Zod brut EN. UX cassée — le scénario exact du ticket.
- Audit des autres écrans : seuls `LoginScreen` et `RegisterScreen` sont des formulaires Zod-pertinents. `WorldSelector` n'a pas de saisie utilisateur (`villageName` calculé). `AttackDetailModal` fait de la validation contextuelle (sliders, état session) — pas un cas Zod.

### Implémentation

Décision validée 2026-05-06 appliquée telle quelle, choix tranchés avec l'utilisateur :
- `password.min(8)` partout (alignement sur la règle backend stricte).
- Messages d'erreur **FR dans le schema partagé** — affichés directement, pas de mapping i18n côté front.
- Scope **auth uniquement** — pas de chasse aux autres formulaires (le seul écran avec formulaire texte était auth).

Changements :

- `packages/shared/src/auth/schemas.ts` (nouveau) : `loginSchema`, `registerSchema`, `refreshSchema`. Types inférés via `z.infer`. `types.ts` réduit aux types de réponse non validées (`AuthUser`, `AuthTokens`, `AuthSessionResponse`).
- `battleforthecrown-backend/src/modules/auth/dto/{login,register,refresh}.dto.ts` : re-exports depuis `@battleforthecrown/shared/auth`. Controllers inchangés (mêmes imports). Backend compile, comportement identique sauf que les messages d'erreur 400 sont désormais en FR.
- `battleforthecrown-pixi/src/lib/useZodForm.ts` (nouveau, ~25 lignes) : hook custom `{ errors, validate, clearErrors }` avec **erreurs par champ** (pour rendu sous l'input concerné). Duck typing sur `safeParse` pour contourner la variance stricte de Zod v4 sur `<TSchema extends ZodSchema>`.
- `useZodForm.test.ts` (nouveau) : 6 tests Vitest couvrant succès, échec par champ, refine path, clearErrors. Suite globale 63/63 verts.
- `LoginScreen.tsx` / `RegisterScreen.tsx` : import `loginSchema` / `registerSchema` depuis shared, hook `useZodForm`, erreurs affichées par champ (`errors.email`, `errors.password`, `errors.confirmPassword`). `confirmPassword` étendu localement avec `.extend({...}).refine(...)` — n'existe pas backend, donc reste front-only (commenté inline).
- `battleforthecrown-pixi/.claude/rules/react-hud.md` : nouvelle section **Formulaires** documentant le pattern (schema shared + `useZodForm`, erreurs par champ vs `submitError` global, cible de bascule RHF).

### Vérification

- `yarn workspace @battleforthecrown/shared build` : OK.
- `yarn workspace battleforthecrown-backend build` : OK.
- `yarn workspace battleforthecrown-pixi type-check` : OK.
- `yarn workspace battleforthecrown-pixi test` : 63/63 verts (6 nouveaux + 57 existants).
- QA backend (`PORT=15002`) — fixtures `qa-zod-*` créées puis nettoyées :
  - `POST /auth/register` avec `password: '1234567'` → 400, message FR `"Mot de passe : 8 caractères minimum"` remontée du schema shared.
  - `POST /auth/register` avec `password: '12345678'` → 201, tokens.
  - `POST /auth/register` avec `email: 'not-an-email'` → 400, `"Email invalide"`.

### Follow-up éventuel (hors scope)

- `ZodValidationPipe` (`backend/src/common/pipes/zod-validation.pipe.ts`) renvoie `{message: 'Validation failed', errors: format()}`. Le frontend `ApiError.message` extrait `payload.message` → affiche `"Validation failed"` au lieu du message FR détaillé. En pratique invisible (le frontend valide d'abord avec le même schema, donc une mutation ne part jamais avec un payload invalide), mais améliorable : le pipe pourrait extraire le premier `issue.message` pour le `BadRequestException`. Petit fix backend, ~5 lignes. À traiter séparément si gênant.
- Migration Zod-in-shared pour les autres DTOs backend (combat `attack-command`, village `upgrade-building`, `strategy`, army `train-units`, world `join-world`) — déjà des schemas Zod locaux côté back, à mutualiser quand un usage front nécessite la validation. Pas de besoin actuel.

## Tickets liés

- [11 — Optimistic UI asymétrique](./11-pixi-optimistic-ui-asymmetric.md) — autre exemple de convention non systématique.
- [04 — World config permissive typing](./04-world-config-permissive-typing.md) — relié : la décision Zod-in-shared y est aussi appliquée pour `WorldConfig`.

## Dimensions à valider en sortie

- Décision tranchée : appliquer zod, basculer sur React Hook Form + Zod, ou retirer la convention.
- Tous les formulaires existants suivent la décision.
- `.claude/rules/conventions.md` mis à jour pour refléter la réalité.
- Si zod : schémas mutualisés avec le backend via `packages/shared` quand c'est pertinent.

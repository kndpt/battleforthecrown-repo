# Run #023 — migrate-runtime-toasts-design-system

> **Statut** : DONE
> **Démarré** : 2026-05-14
> **Terminé** : 2026-05-14

## Cible

- **Phase roadmap** : Hors roadmap
- **Spec source** : Aucune
- **Type** : refacto
- **Modules backend** : —
- **Modules frontend** : `pixi/layout`, `pixi/design-system`, `pixi/ws-bindings`, `pixi/army`

## Dépendances

- Aucune dépendance bloquante.
- Liens connexes à consulter pour le pattern de migration UI :
  - `tasks/archive/48-kingdom-activities-design-system.md`
  - `tasks/archive/51-bottom-sheet-design-system-base.md`

## Critère de fin (acceptance)

- [x] Tous les toasts runtime visibles passent par le composant toast du design-system ou par un wrapper direct autour de lui.
- [x] Les 11 appels `pushToast` identifiés restent fonctionnels et affichent un titre + une description cohérente.
- [x] Les tones runtime `success`, `info`, `warning`, `error` sont rendus correctement, avec `error` mappé visuellement en `danger`.
- [x] Le TTL et le bouton fermer retirent toujours le toast.
- [x] Aucun ancien toast Lucide de `src/ui/toasts` n'est utilisé par un écran runtime, ou son maintien est explicitement justifié dans le rapport final.
- [x] `battleforthecrown-pixi/src/api/ws-bindings.test.ts` reste vert sur l'assertion du toast de construction.
- [x] `/design-system` affiche toujours la section Toasts sans régression évidente.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale

- Inventorier tous les producteurs `pushToast` et les classer par événement, tone, description et icône attendue.
- Adapter ou extraire le composant design-system toast pour un usage runtime sans casser `/design-system`.
- Remplacer `ToastStack` par le rendu design-system, avec mapping `error -> danger`, fallback d'icône et fermeture/TTL conservés.
- Aligner les toasts existants dans `ws-bindings.ts` pour afficher des labels localisés.
- Traiter l'ancienne lib `src/ui/toasts` : migrer l'usage `ui-test` ou documenter pourquoi il reste hors runtime.
- Mettre à jour les tests frontend autour du store/toasts.
- Vérifier visuellement `/design-system` et au moins un écran runtime qui monte `ToastStack`.

## Progress

- 2026-05-14 — Préflight OK : Git clean, fiche `PLANNED`, rules repo, `SPEC.md`, briefing Pixi, `bftc-react-hud`, `bftc-tests-policy` et worktree-dev lus.
- 2026-05-14 — Passage en `RUNNING`; cartographie toast lancée.
- 2026-05-14 — Cartographie terminée : 11 producteurs `pushToast` confirmés, `src/ui/toasts` limité à `/ui-test`, aucun caller backend/shared.
- 2026-05-14 — Refinement : patch minimal retenu. `ToastStack` consomme `ToastPreview`; mapping `error -> danger`; icônes fallback par tone; producteurs inchangés.
- 2026-05-14 — Implémentation : `ToastStack` migré sur `ToastPreview`; `ToastPreview` accepte une description optionnelle et expose un bouton fermer accessible.
- 2026-05-14 — Ajustement UX : toast centré sur mobile et décalé sous le header pour éviter de masquer les ressources.
- 2026-05-14 — Localisation : labels bâtiments/unités mappés dans `ws-bindings.ts` pour éviter les noms enum en anglais.
- 2026-05-14 — Tests : `ToastStack.test.tsx` ajouté; tests ciblés `ws-bindings`/`ToastStack` verts; `static-check` vert sur worktree.

## Décisions prises

- Garder `useUiStore` comme contrat runtime stable. Ne pas ajouter `icon` au store pour éviter de modifier les 11 producteurs.
- Garder `src/ui/toasts` hors scope runtime : usage constaté uniquement dans la démo `/ui-test`, pas dans les écrans de jeu.
- Ne pas centraliser `ToastStack` dans `AuthenticatedShell` dans ce run : le besoin est visuel, et les écrans existants montent déjà un seul stack par route de jeu.
- Localiser les descriptions au niveau des bindings WS, là où les payloads enum sont convertis en texte joueur.

## Rapport final

Runtime toast migré sur le composant design-system sans changer le contrat `useUiStore`.

Fichiers touchés :

- `battleforthecrown-pixi/src/features/layout/ToastStack.tsx` — rendu via `ToastPreview`, mapping `error -> danger`, icônes fallback par tone, position mobile/header ajustée, TTL/close conservés.
- `battleforthecrown-pixi/src/features/design-system/components/ToastPreview.tsx` — `subtitle` optionnel et bouton fermer accessible.
- `battleforthecrown-pixi/src/api/ws-bindings.ts` — libellés bâtiments/unités localisés pour les toasts de construction et d'entraînement.
- `battleforthecrown-pixi/src/features/layout/ToastStack.test.tsx` — régression close/TTL + mapping danger.
- `battleforthecrown-pixi/src/api/ws-bindings.test.ts` — assertions sur labels localisés.

Review 5 axes :

- Correctness : OK, store inchangé; comportement close/TTL testé; labels runtime localisés.
- Readability : OK, mapping explicite `TONE_MAP` / `ICON_MAP` et helper `formatUnitName`.
- Architecture : OK, design-system présentation-only; runtime stateful reste dans `features/layout`.
- Security : OK, aucune donnée externe injectée hors texte React échappé.
- Performance : OK, rendu inchangé en complexité; pas de nouveau listener global.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Tous les toasts runtime visibles passent par le design-system — preuve : `ToastStack.tsx` rend `ToastPreview`.
  - [x] Les 11 appels `pushToast` restent fonctionnels — preuve : producteurs inchangés + `ws-bindings.test.ts` vert.
  - [x] `error` est rendu en `danger` — preuve : `ToastStack.test.tsx` vérifie la classe danger `border-[#a93226]`.
  - [x] TTL et fermeture fonctionnent — preuve : `ToastStack.test.tsx` couvre close + auto-dismiss.
  - [x] Ancien toast Lucide non utilisé en runtime — preuve : cartographie, usage limité à `/ui-test`.
  - [x] `/design-system` reste accessible — preuve : Vite local a servi `/design-system` en 200 pendant le run.
- **Tests automatisés** :
  - `VITE_API_BASE_URL=http://localhost:15002 VITE_WS_URL=http://localhost:15002 rtk yarn workspace battleforthecrown-pixi test ws-bindings.test.ts ToastStack.test.tsx` — vert, 23 tests.
  - `rtk yarn static-check` — vert sur le worktree du run.
- **Smokes lancés** : Non applicable, aucun fichier backend touché par le run toast.
- **Smokes ajoutés/modifiés** : Aucun, raison : changement frontend présentation/runtime local.
- **QA fonctionnelle agent** : Vite lancé sur `http://localhost:5174`; placement du toast inspecté sur `/game`.

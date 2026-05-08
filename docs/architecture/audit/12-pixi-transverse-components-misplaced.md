# 12 — Composants transverses placés dans `features/` au lieu de `ui/`

**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `battleforthecrown-pixi`
**Tags** : layering, architecture, ui

## Symptôme

Plusieurs composants utilisés transversalement par 4+ écrans sont rangés dans `src/features/` (couche métier) au lieu de `src/ui/` (couche design system). La convention documentée veut que le design system contienne les primitives réutilisables, mais elle n'est pas appliquée pour les composants de layout transverse.

## Localisation

- `src/features/layout/GameHeader.tsx` (213 lignes) — réutilisé dans `VillageView`, `WorldMapScreen`, `ArmyScreen`, `MessagesScreen`.
- `src/features/village/BottomNavigationBar.tsx` (217 lignes) — réutilisé dans 4 écrans.
- À auditer : `BuildingManagementPanel`, `QueueBottomSheet`, autres panels potentiellement transverses.

Imports actuels (App.tsx, écrans) :
```ts
import { GameHeader } from '@/features/layout/GameHeader';
import { BottomNavigationBar } from '@/features/village/BottomNavigationBar';
```

Convention documentée (`battleforthecrown-pixi/.claude/rules/`) :
> Pour un nouveau composant transverse → `src/ui/`.

## Détail technique

Le layering visé est :
- `src/ui/` — primitives **stateless** sans dépendance store/api (Button, Modal, Tooltip, Card…).
- `src/features/<domain>/` — composants **avec logique métier** (BuildingDetailModal, UnitCard, AttackPreview…).

Cas limites actuels :
- `GameHeader` affiche les ressources et l'avatar joueur, donc consomme `useResourcesStore` / `useAuthStore`. Stateful → ne rentre pas dans `ui/` strict. Mais il est transverse à 4 écrans, donc pas vraiment "feature".
- `BottomNavigationBar` route entre les écrans (consomme `useNavigate` et probablement `useAuthStore` pour l'état). Pareil.

Question structurelle : `ui/` accepte-t-il des composants stateful ? Ou faut-il une 3e couche (`layout/`, `composites/`, `shell/`) ?

## Impact

- **Découverte difficile** : un nouveau dev cherche le header dans `src/ui/` et ne le trouve pas.
- **Couplage caché** : si un autre écran veut réutiliser `GameHeader`, il importe `@/features/layout/...` ce qui suggère une dépendance feature.
- **Drift de conventions** : la règle `ui/ pour transverse` n'est pas appliquée, donc soit la règle est mauvaise, soit le code l'est. À trancher.
- **Refacto futur** : si on bouge ces composants, les imports dans 4 écrans changent. Pas un drame, mais signal qu'il faut le faire tôt.

## Contexte

Probablement issu de l'organisation initiale "par feature" avant que les besoins transverses émergent. Le `layout/` sous `features/` est un compromis intermédiaire.

## Pistes à explorer

- **Option A — déplacer dans `ui/layout/`** : crée une sous-couche layout dans le design system. Accepte les composants stateful. Les primitives stateless restent à plat dans `ui/`.
- **Option B — créer `src/shell/` ou `src/app/`** : une couche dédiée aux composants "structure d'application" (header, nav, error boundary, providers). Sépare clairement primitives / shell / features.
- **Option C — garder dans `features/layout/`** : reconnaître que ces composants ont de la logique métier (sélecteur de monde, etc.), donc leur place est en `features/`. Mettre à jour la convention pour refléter cette réalité.
- **Audit complet** : lister tous les composants utilisés par 3+ écrans et décider individuellement.

## Tickets liés

- [11 — Optimistic UI asymétrique](./11-pixi-optimistic-ui-asymmetric.md) — autre exemple de convention frontend non systématique.
- [13 — GameSession wrapper fragile](./13-pixi-game-session-fragile-wrapper.md) — relié : où placer la "shell" de l'app.

## Dimensions à valider en sortie

- Convention claire écrite pour : où placer un composant selon son couplage à store/api et son nombre de consommateurs.
- Tous les composants existants suivent la convention (déplacement effectué OU justification écrite).
- `.claude/rules/` mis à jour si la règle évolue.

## Résolution (2026-05-08)

### Drift constaté avec le ticket d'origine

Lecture du code à J-2 du ticket :

- `GameHeader.tsx` cité à **213 lignes** : en réalité **105 lignes** (`features/layout/GameHeader.tsx:1-105`). Déjà refactorisé en assemblage des primitives stateless `ui/layout/` (`HeaderBar`, `PlayerProfile`, `ResourceDisplay`, `PopulationIndicator`, `HeaderActions`) + widgets feature (`CrownDisplay`, `PowerBadge`). Aucun déplacement requis.
- `BuildingManagementPanel`, `QueueBottomSheet` cités « à auditer pour potentiel transverse » : importés **uniquement** par `VillageView` → faux positifs, bien placés sous `features/village/`.
- `GameHeader` annoncé « réutilisé dans 4 écrans » : en réalité **5** (avec `WorldLockedScreen`).
- `ToastStack.tsx` (51 lignes, `features/layout/`) — transverse aux 5 écrans, **oublié** par le ticket.
- `src/ui/layout/` annoncé absent : **existait déjà** avec les primitives stateless ci-dessus.

### Vrai problème restant

Un seul vrai misplacement : `BottomNavigationBar.tsx` (217 lignes) sous `features/village/` alors qu'il est consommé par 5 écrans (Village/World/Army/Messages/WorldLocked). Son hook compagnon `useBuildingsForLockCheck.ts` n'a aucun consommateur village-spécifique non plus (utilisé par `BottomNavigationBar` et `WorldMapScreen`).

### Décision et patch

Option **D — formaliser l'existant** plutôt que les A/B/C du ticket :

L'archi implicite déjà en place est **3 couches** :

```
src/ui/<category>/         primitives stateless (Button, HeaderBar, PlayerProfile…)
src/features/layout/       assemblies stateful transverses (GameHeader, ToastStack)
src/features/<domain>/     spécifique à un domaine
```

`features/layout/` joue déjà le rôle de "shell layer" que l'option B suggérait via un nouveau top-level `src/shell/`. Pas la peine d'en créer un.

Patch :

- `git mv features/village/BottomNavigationBar.tsx → features/layout/BottomNavigationBar.tsx`
- `git mv features/village/useBuildingsForLockCheck.ts → features/layout/useBuildingsForLockCheck.ts`
- 5 imports mis à jour (`VillageView`, `ArmyScreen`, `MessagesScreen`, `WorldLockedScreen`, `WorldMapScreen`)
- `.claude/rules/react-hud.md` : règle clarifiée en 3 cas (stateless transverse → `ui/`, stateful transverse → `features/layout/`, feature-specific → `features/<domaine>/`)

Diff total : 2 renames + 6 lignes d'imports + 6 lignes de doc. Zéro changement runtime. `tsc --noEmit` vert, 57/57 tests verts.

### Hors scope (volontaire)

- `GameHeader`, `ToastStack`, `DebugOverlay` restent en `features/layout/` (déjà conformes à la règle).
- Pas de création de `src/shell/` (ne ferait que doubler `features/layout/`).
- Pas de tentative de rendre `BottomNavigationBar` stateless en sortant le `useBuildingsForLockCheck` (le couplage hook→composant est bénéfique : la logique de gating est encapsulée dans le composant qui l'expose).

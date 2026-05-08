# NumericKeypad + refonte UnitCard

**Objectif** : ajouter un composant `NumericKeypad` réutilisable dans la lib UI, et refondre la carte de recrutement (`UnitCard`) pour remplacer `[-]  qty  [+]  [MAX]` par `valeur tappable + slider full-width`.

## Contexte (état actuel)

- `battleforthecrown-pixi/src/features/army/UnitCard.tsx` (lignes 286-317) : ligne `-/+/MAX` dans la card de recrutement.
- `Slider` existe déjà (`src/ui/sliders/Slider.tsx`) avec variant `info` — réutilisable directement.
- `BottomSheet` existe (`src/ui/panels/BottomSheet.tsx`) — wrapper mobile-first.
- `tasks/` à la racine (existant), `archive/` dedans pour les tickets résolus.

## Plan

### 1. Primitive `NumericKeypad`
- [x] Créer `battleforthecrown-pixi/src/ui/keypads/NumericKeypad.tsx`
  - Props : `value: number`, `onChange: (v: number) => void`, `min?: number`, `max?: number`, `variant?: 'default' | 'info' | 'warning' | 'danger'`, `size?: 'md' | 'lg'`, `showMaxButton?: boolean`, `unitLabel?: string` (ex : "/ 50")
  - Display : valeur courante (text-3xl Cinzel) + label max (text-sm kingdom-600) si fourni
  - Grid 4×3 : `[1][2][3] [4][5][6] [7][8][9] [⌫][0][MAX]`
  - Touches : `IconButton` ou `Button` lg, variant en accord avec la prop
  - Logique : append (`v * 10 + d`, clamp à `max`), ⌫ (`Math.floor(v/10)`), MAX (`set max`), `0` initial auto-replace
  - CVA pour les variants, forwardRef, `displayName`
- [x] Créer `battleforthecrown-pixi/src/ui/keypads/NumericKeypadSheet.tsx`
  - Props : `open`, `onClose`, `onConfirm: (v: number) => void`, `title?: string`, + props du `NumericKeypad`
  - Compose : `BottomSheet` + `Panel` (variant parchment) + header titre + body keypad + footer `[Annuler] [OK]`
  - State local pour la valeur en cours d'édition (initialisée à `value` à l'open) — confirme via OK, restaure via Annuler
- [x] Créer `battleforthecrown-pixi/src/ui/keypads/index.ts` avec exports
- [x] Ajouter exports dans `battleforthecrown-pixi/src/ui/index.ts`
- [x] Créer `battleforthecrown-pixi/src/ui/keypads/README.md` (variants, tailles, props, exemples)

### 2. Tests pure-logic
- [x] `battleforthecrown-pixi/src/ui/keypads/NumericKeypad.test.tsx`
  - append digit (1, 2 → 12)
  - clamp à `max` (max 50, tape 9 → reste 50)
  - ⌫ (123 → 12)
  - MAX → set à `max`
  - `0` initial auto-replace au premier digit (0 → tape 4 → 4, pas 04)
  - Disabled quand `max === 0`

### 3. Section ui-test
- [x] Créer `battleforthecrown-pixi/src/features/ui-test/components/KeypadsSection.tsx` avec 3+ exemples :
  - Default standalone
  - Info avec max=10000 (cas troupes)
  - Sheet déclenchée par bouton "Tap to open"
- [x] Ajouter import dans `UiTestScreen.tsx` + barrel `components/index.ts`

### 4. Refonte `UnitCard`
- [x] Dans `UnitCard.tsx`, remplacer le bloc lignes 286-317 (`flex items-center justify-between`) par :
  - Bloc valeur centré : `<span text-3xl Cinzel>{quantity}</span>` + `<span text-xs kingdom-600>/ {maxTrainable}</span>` — le tout cliquable (`button` ou `div role="button"`) qui ouvre la sheet
  - `<Slider variant="info" size="md" min={1} max={maxTrainable} value={quantity} onChange={...} disabled={maxTrainable < 1} />` full-width
- [x] Ajouter state `keypadOpen: boolean` + `<NumericKeypadSheet>` rendu conditionnellement
- [x] Supprimer `incrementAmount`, `decrementAmount`, `setMaxAmount` (plus utilisés)
- [x] Garder le `setQuantity(1)` au `onSuccess` (ligne 159)

### 5. Documentation
- [x] Mettre à jour `battleforthecrown-pixi/docs/ui-library.md` :
  - Ajouter `keypads/` dans l'arbre `Structure`
  - Ajouter ligne `NumericKeypad` dans le tableau `Primitives stateless`

### 6. Vérification
- [x] `yarn workspace battleforthecrown-pixi tsc --noEmit` → 0 erreur
- [x] `yarn workspace battleforthecrown-pixi test` → vert
- [x] Lancer dev server, ouvrir `/ui-test`, vérifier visuellement le rendu du keypad standalone et de la sheet
- [x] Lancer le jeu, ouvrir l'écran Armée, vérifier la nouvelle UI de recrutement (slider + tap sur valeur)
- [x] QA user IG (cf. `.claude/rules/qa.md`) : checklist clic-only

## Décisions prises

- **Variant par défaut keypad** : `info` (troupes/armée → game-blue, cf. ui-design-system §Couleurs par domaine).
- **Size touches** : `lg` (~56px) pour confort tactile mobile.
- **OK explicite** dans la sheet : pas d'auto-confirm pour éviter erreurs de saisie.
- **Pas de tests de `NumericKeypadSheet`** : c'est de l'orchestration (open/close/confirm) — couvert par QA visuelle. Tests pure-logic = `NumericKeypad` seul.
- **Pas de modif `UnitDetailModal`** : le modal détaille l'unité, pas la quantité — hors scope.

## Hors scope (rappel user)

- Pas d'intégration dans les autres écrans (envoi expédition, attaque ciblée). À faire plus tard si besoin.
- Pas de refonte de la card autre que la zone qty/MAX.

## Review

### Livré

- `src/ui/keypads/NumericKeypad.tsx` : primitive idiote (CVA, forwardRef), display valeur Cinzel + max secondaire, grid 4×3, append/⌫/MAX/clamp, support `min`, `max`, `variant`, `size`, `unitLabel`, `showMaxButton`. `data-testid="keypad-value"` sur le display pour permettre les tests sans pollution de l'API.
- `src/ui/keypads/NumericKeypadSheet.tsx` : wrapper `BottomSheet` + `Panel` parchment, draft local, `Annuler` / `OK` explicites. La valeur n'est remontée que sur OK.
- `src/ui/keypads/README.md` : doc complète (props, comportement, exemples).
- `src/ui/keypads/NumericKeypad.test.tsx` : 9 tests pure-logic (append, clamp, ⌫, MAX, 0 initial, disabled states, onChange forwarding). Tous verts.
- `src/features/ui-test/components/KeypadsSection.tsx` : 4 démos (info+max=50, warning+max=10000, sheet déclenchée, verrouillé max=0).
- `src/features/army/UnitCard.tsx` : ligne `[-] qty [+] [MAX]` remplacée par `<button valeur+max>` cliquable + `Slider` info full-width + `NumericKeypadSheet` rendu en parallèle. `incrementAmount`/`decrementAmount`/`setMaxAmount` supprimés. `setQuantity(1)` post-train préservé.
- `docs/ui-library.md` : arbre `Structure` + tableau primitives mis à jour.

### Vérification

- [x] `tsc --noEmit` → 0 erreur.
- [x] `yarn test --run` → 13 fichiers, **79 tests verts** (12 sur `NumericKeypad`).
- [x] Dev server boot OK, `/ui-test` renvoie 200.
- [x] **QA user IG validée** par le user après itérations.

### Itérations post-validation initiale

Trois ajustements après la première QA visuelle :

1. **Sheet rendu hors `space-y-3`** : la `<NumericKeypadSheet>` était dans le parent `<div className="space-y-3" onClick={stop}>` de `UnitCard`. Tailwind appliquait `margin-top: 0.75rem` à l'overlay fixed, créant un liseré transparent en haut. Fix : wrap du return dans un Fragment, sheet rendue à côté de `</Card>`, conditionnée à `!isTraining && !isLocked`.
2. **Footer OK/Annuler invisible** : le `Panel` n'était pas contraint en hauteur, son contenu (header + keypad lg + footer) dépassait `90vh`, le footer overflowait sous le viewport. Fix : `flex flex-col max-h-[85vh]` sur le Panel + `flex-shrink-0` sur header/footer + `flex-1 overflow-y-auto` sur body. Bonus : `zIndex={50}` sur la sheet pour passer au-dessus de la `BottomNavigationBar` (`z-40`).
3. **UX "première frappe remplace"** : à l'ouverture, taper un chiffre devait écraser la valeur (au lieu de l'append). Ajout d'une prop `clearOnFirstDigit` sur `NumericKeypad` (state interne `pristine`, ⌫ et MAX consomment l'état sans remplacer) ; `NumericKeypadSheet` l'active par défaut et remonte le pavé via `key={openSession}` qui s'incrémente à chaque `open === true` pour réarmer pristine. Bonus connexe : si `value >= max`, la frappe d'un chiffre redémarre aussi (évite le user bloqué au plafond après MAX).

### Décisions notables

### Décisions notables

- **Clamp à `[1, maxTrainable]` côté caller** (UnitCard), pas dans le keypad. Permet à l'utilisateur de descendre visuellement à 0 dans le pavé pour repartir de zéro, et le Sheet remonte au caller qui clampe.
- **Pas de `min` enforcé sur le keypad côté UnitCard** : si quelqu'un valide à 0, le caller floor à 1 — meilleure UX que de bloquer le ⌫.
- **Touches du pavé en variant `info`** + bouton MAX en `warning` (cohérent avec l'ancien MAX gold) + ⌫ en `neutral`. Le bouton OK de la sheet est `info` pour la cohérence troupes.
- **Tests pure-logic seulement sur `NumericKeypad`**. La Sheet n'est pas testée (orchestration open/close/confirm — couvert par QA visuelle, conforme à `.claude/rules/tests.md`).

### Docs

Mises à jour : `docs/ui-library.md` (entrée keypads dans l'arbre + ligne dans le tableau primitives).
Pas de changement : `docs/ui-design-system.md` (le composant suit les conventions existantes — pas de nouveau token introduit), `docs/ui-writing-style.md` (pas de nouvelle micro-copy autre que "MAX" / "Annuler" / "OK" déjà dans le ton).

### Hors scope confirmé

- Aucune intégration ailleurs (expédition, attaque). Ces écrans pourront consommer `NumericKeypadSheet` directement quand le besoin se présentera.


# Run #093 — feature-natural-trait-badge-modal

> **Statut** : DONE
> **Démarré** : 2026-07-04
> **Terminé** : 2026-07-04

## Cible

- **Phase roadmap** : Hors phases nommées — follow-up UI de la feature transverse 088 (village-natural-traits), même veine que 089 (Phase 12 — ajouts mineurs MVP).
- **Spec source** : `docs/gameplay/27-village-natural-traits.md` § « Révélation » (invariant anti-leak à respecter) + affichage du trait propre.
- **Type** : feature (surfaçage explicatif d'une donnée déjà spec'ée en 088 + exposition intel scout).
- **Modules** :
  - backend : `world` (VillageIntelDto + projection intel scout — expose `naturalTrait` **uniquement** dans le canal intel scouté, jamais dans le feed carte public).
  - frontend : `features/game/VillageHero.tsx`, `features/combat/scoutReportView.ts` + `design-system/components/ScoutReportCard.tsx`, `features/world/SelectedEntityPanel.tsx` + `design-system/components/villageMapPanel/`, nouveaux composants `NaturalTraitBadge` + `NaturalTraitModal`, helper pur `naturalTraitInfo.ts`.
  - transverse : `packages/shared/src/village/traits.ts` (data — lecture seule), `packages/shared/src/world/dtos.ts` (VillageIntelDto — ajout champ optionnel `naturalTrait`).

## Décision de périmètre (validée user)

**Ennemi scouté inclus (back+front).** Le trait suit la même règle de révélation que le butin / style stratégique du panneau : visible **si et seulement si** une intel scout est disponible. On ajoute `naturalTrait` au **canal intel scouté** (`VillageIntelDto`), **jamais** au feed carte public (`world-entities`). L'invariant anti-leak (`world-entities-natural-trait-leak.spec.ts`) reste vert et non modifié.

## Assets (validés user) — remplacent les emojis

Icônes fournies, rangées dans `battleforthecrown-pixi/public/assets/natural-traits/`. **Remplacent les emojis** `NATURAL_TRAIT_DISPLAY.icon` (🌲/⛏️/⚙️/🌾) sur toutes les surfaces (badge + modal).

| Trait | Asset | Bonus |
| --- | --- | --- |
| `DENSE_FOREST` | `natural-traits/dense-forest.webp` | +10 % Bois |
| `RICH_QUARRY` | `natural-traits/rich-quarry.webp` | +10 % Pierre |
| `IRON_VEIN` | `natural-traits/iron-vein.webp` | +10 % Fer |
| `PLAINS` | `natural-traits/plains.webp` | Aucun bonus |

- Chargées via `publicAsset('/assets/natural-traits/<slug>.webp')` (helper `@/lib/publicAsset`), `<img>` — pas d'emoji `Text`.
- **Le mapping trait → asset vit côté front** (dans `naturalTraitInfo.ts` ou le badge), **pas dans `packages/shared`** : shared est consommé backend et ne doit pas porter de chemin d'asset front. Le champ `icon` emoji de shared peut rester comme fallback ou être ignoré côté rendu.

### Variantes d'affichage du badge (validé user)

`NaturalTraitBadge` supporte **deux variantes**, toutes deux cliquables → même modal :

| Variante | Rendu | Surfaces |
| --- | --- | --- |
| `icon-only` | **Asset seul** (icône cliquable), **sans label texte** | **Surface A — header `/game`** : le label « Carrière riche » prend trop de largeur dans la barre de chips. On garde juste l'asset. |
| `full` | Asset + label (« Forêt dense »…) | **Surfaces B (rapport scout) et C (panneau carte)** : place disponible, label utile pour la lisibilité. |

La modal d'info est identique quelle que soit la variante (elle porte le contexte complet).

## Dépendances

- Run 088 (village-natural-traits) — ✅ DONE. Fournit la data (`NATURAL_TRAIT_DISPLAY`, `NATURAL_TRAIT_PRODUCTION_BONUS`, `VillageNaturalTrait`), le badge muet du header et l'exposition `naturalTrait` dans le DTO scout combat.
- Pattern de slot badge dans `ScoutReportCard` (shieldBadge / inactivityBadge) issu des runs 089 / 081 / 082 — à réutiliser tel quel pour le trait.

## Critère de fin (acceptance)

- [ ] [auto] `naturalTraitInfo(trait)` retourne le contenu modal correct (label, icône, bonus %, ressource) pour chaque trait, incl. `PLAINS` → « Aucun bonus » (unit).
- [ ] [auto] `scoutReportView.ts` ne duplique plus le formatage du bonus % (`+10 % Bois`) — consomme le helper partagé, test existant vert.
- [ ] [auto] `NaturalTraitBadge` rend un `<button>` avec `aria-label` (activable clavier, role button) et une `<img>` asset `/assets/natural-traits/*.webp` — pas un `<span title>` ni un emoji.
- [ ] [auto] `naturalTraitInfo(trait).iconAsset` pointe le bon `.webp` pour chaque trait (unit).
- [ ] [auto] Test anti-leak `world-entities-natural-trait-leak.spec.ts` **toujours vert** (trait absent du feed carte public).
- [ ] [auto] Backend : `VillageIntelDto` porte `naturalTrait` **seulement** quand l'intel provient d'un scout ; village non scouté → champ absent (unit/smoke projection intel).
- [ ] [visuel — Kelvin] Surface A (header mon village, `/game`) : trait rendu en **asset seul** (`icon-only`, sans label) ; clic → modal parchemin (nom, icône, bonus %, ressource, mention « fixe/permanent »).
- [ ] [visuel — Kelvin] Surface B (rapport scout frais) : trait rendu en **badge cliquable `full`** (icône + label) → même modal.
- [ ] [visuel — Kelvin] Surface C (panneau carte) : mon village → badge trait ; village ennemi **scouté** → badge trait ; village ennemi **non scouté** → aucun trait (anti-leak préservé).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-react-hud`, `bftc-tests-policy`, `bftc-qa`
- Doc DA : `battleforthecrown-pixi/docs/ui-{library,design-system}.md`
- Spec : `docs/gameplay/27-village-natural-traits.md`

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — Socle réutilisable** : `naturalTraitInfo.ts` (helper pur : dédupe le `bonusLabel` de `scoutReportView.ts` + mapping trait → asset `/assets/natural-traits/<slug>.webp`), `NaturalTraitBadge.tsx` (button DA, `<img>` asset au lieu de l'emoji, prop `variant: 'icon-only' | 'full'`), `NaturalTraitModal.tsx` (via `BaseModal`, tone parchemin/brown, `<img>` asset). [3 fichiers]
- **T2 — Backend intel scout** : ajouter `naturalTrait?` à `VillageIntelDto` (`packages/shared/src/world/dtos.ts`) + projection intel scout côté `world` qui remplit le champ **uniquement** depuis une intel scoutée. Ne pas toucher au feed `world-entities`. [≤3 fichiers]
- **T3 — Surface A** : remplacer le span bespoke `VillageHero.tsx:274-286` par `NaturalTraitBadge variant="icon-only"` (asset seul, pas de label — contrainte de largeur de la barre de chips) + état modal. [1 fichier]
- **T4 — Surface B** : rendre le trait en badge cliquable `variant="full"` dans `ScoutReportCard` (slot type badge) + adapter `scoutReportView.ts` (section → badge). [≤2 fichiers]
- **T5 — Surface C** : `SelectedEntityPanel` / `villageMapPanel` — badge trait `variant="full"` pour mon village (store) **et** ennemi scouté (intel), même gating que le style stratégique. [≤3 fichiers]
- **T6 — Tests + QA** : unit (info builder, badge a11y, projection intel gated) + checklist QA IG. [≤3 fichiers]

## Rapport final

Socle front réutilisable (`naturalTraitInfo` + `NaturalTraitBadge` + `NaturalTraitModal` via `BaseModal`) branché sur 3 surfaces ; trait ennemi exposé au canal intel scouté via `getIntel` (join `Village` gated par l'existence du row intel, zéro migration — trait immuable) ; anti-leak feed public préservé. _(Détail Progress/Décisions : git history.)_

### Acceptance & QA

- [x] `naturalTraitInfo(trait)` contenu correct (incl. PLAINS « Aucun bonus ») — `vitest scoutReportView.test.ts` + naturalTraitInfo consommé → vert.
- [x] `scoutReportView.ts` ne duplique plus le bonus % — `buildNaturalTraitSections` supprimé, source unique `naturalTraitInfo` — `git diff` + `scoutReportView.test.ts` vert.
- [x] `NaturalTraitBadge` = `<button>` + `aria-label` + `<img>` .webp — vérifié review + `NaturalTraitBadge.tsx:34-53`.
- [x] Anti-leak `world-entities-natural-trait-leak.spec.ts` toujours vert — `jest world-entities-natural-trait-leak` → pass (spec non modifiée).
- [x] `VillageIntelDto.naturalTrait` projeté **ssi** intel scout existe — `jest intel.service.spec.ts` (présent/absent) → pass.
- [x] Surfaces A/B/C + « mon village » sur panneau carte — couvert par `SelectedEntityPanel.test.tsx` (mine/scouté/non-scouté) + review GO.
- **Review indépendante** : Déclenchée (raison : back+front + invariant anti-leak). `BLOCK` (critère C « mon village » manquant) → fixé (branche `mine` alimentée depuis `useMyVillagesQuery`) → re-review **GO**.
- **Tests automatisés** : `yarn static-check` vert ; `yarn workspace battleforthecrown-pixi test --run` → 902/902 ; backend unit `intel.service.spec` + leak spec verts.
- **Smokes lancés** : Ciblés — `test:smoke:run -- intel.smoke scouting.smoke` → 10/10 (après re-migration template DB smoke, 6 migrations de retard). Full smoke = CI PR.
- **Smokes ajoutés/modifiés** : Aucun (getIntel = lecture gated déjà couverte par unit + smoke intel existant).
- **QA fonctionnelle agent** : smoke intel/scouting exerce le flux scout→getIntel→trait. Rendu visuel non automatisable → checklist user.
- **Tests IG à faire par le user** :
  1. Header `/game` : icône du trait seule (sans texte) → clic → modale (bonus, ressource, permanence).
  2. Rapport scout d'un village avec trait : badge icône + label → clic → même modale.
  3. Panneau carte de mon propre village : badge trait → modale.
  4. Panneau carte d'un village **ennemi scouté** : badge trait visible.
  5. Panneau carte d'un village ennemi **non scouté** : aucun badge trait (anti-leak).

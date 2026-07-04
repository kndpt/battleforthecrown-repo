# Run #093 — feature-natural-trait-badge-modal

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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
- [ ] [visuel — Kelvin] Surface A (header mon village) : clic badge trait → modal parchemin (nom, icône, bonus %, ressource, mention « fixe/permanent »).
- [ ] [visuel — Kelvin] Surface B (rapport scout frais) : trait rendu en **badge cliquable** → même modal.
- [ ] [visuel — Kelvin] Surface C (panneau carte) : mon village → badge trait ; village ennemi **scouté** → badge trait ; village ennemi **non scouté** → aucun trait (anti-leak préservé).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-react-hud`, `bftc-tests-policy`, `bftc-qa`
- Doc DA : `battleforthecrown-pixi/docs/ui-{library,design-system}.md`
- Spec : `docs/gameplay/27-village-natural-traits.md`

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — Socle réutilisable** : `naturalTraitInfo.ts` (helper pur : dédupe le `bonusLabel` de `scoutReportView.ts` + mapping trait → asset `/assets/natural-traits/<slug>.webp`), `NaturalTraitBadge.tsx` (button DA, `<img>` asset au lieu de l'emoji, réutilise un pattern chip header), `NaturalTraitModal.tsx` (via `BaseModal`, tone parchemin/brown, `<img>` asset). [3 fichiers]
- **T2 — Backend intel scout** : ajouter `naturalTrait?` à `VillageIntelDto` (`packages/shared/src/world/dtos.ts`) + projection intel scout côté `world` qui remplit le champ **uniquement** depuis une intel scoutée. Ne pas toucher au feed `world-entities`. [≤3 fichiers]
- **T3 — Surface A** : remplacer le span bespoke `VillageHero.tsx:274-286` par `NaturalTraitBadge` + état modal. [1 fichier]
- **T4 — Surface B** : rendre le trait en badge cliquable dans `ScoutReportCard` (slot type badge) + adapter `scoutReportView.ts` (section → badge). [≤2 fichiers]
- **T5 — Surface C** : `SelectedEntityPanel` / `villageMapPanel` — badge trait pour mon village (store) **et** ennemi scouté (intel), même gating que le style stratégique. [≤3 fichiers]
- **T6 — Tests + QA** : unit (info builder, badge a11y, projection intel gated) + checklist QA IG. [≤3 fichiers]

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : **requise** — back+front simultané + touche un invariant anti-leak spec (`27 § Révélation`). Axes prioritaires : correctness (gating intel), security/leak (trait jamais dans le feed public), architecture (socle réutilisable sans logique métier dans `src/ui/`).
- **Tests automatisés** : …
- **Tests IG user** : checklist ≤5 items (surfaces A/B/C + cas ennemi non scouté).

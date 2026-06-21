# Run #079 — feature-village-map-panel-redesign

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap — polish UI / migration design-system
- **Spec source** : mockup *Panneau de Village (Carte)* (claude.ai/design, projet `142f2bac`), `docs/gameplay/11-scouting.md`
- **Type** : feature (refonte UI, frontend-only)
- **Modules** : frontend `battleforthecrown-pixi` uniquement — aucun backend, aucune migration DB

Remplacer `MapEntityCallout` (callout sombre générique) par la **carte flottante parchemin** du mockup, paramétrique sur 4 variantes correspondant aux 4 use cases déjà câblés dans `SelectedEntityPanel` :

| Variante | Cas jeu | Corps | Footer |
|---|---|---|---|
| `mine` | mon village | dossier (troupes + loot + rempart + style) | Entrer · Envoyer ress. · Renfort |
| `unscouted` | ennemi joueur non scouté | intel verrouillée | Espionner · Attaquer |
| `scouted` | ennemi joueur scouté | dossier complet + fraîcheur | Espionner · Attaque (bloquée ÷3) · Envoyer |
| `barbare` | village barbare | lecture par tier T1→T5 | Espionner · Attaquer |

Tête (identité + coords + type) et bande de puissance (village / joueur) communes aux 4.

## Dépendances

- `055-feature-intel-notebook` ✅ DONE — fournit `VillageIntelDto` (`units`, `resources`, `wallLevel`, `strategy`, `seenAt`, `sourceReportId`) + endpoint `GET /worlds/:worldId/intel/:villageId`. Socle de la variante `scouted`. **Toutes les données nécessaires existent déjà** côté backend.

## Critère de fin (acceptance)

- [ ] Les 4 variantes rendues dans `/design-system`, fidèles au mockup (visuel — QA IG user)
- [ ] `SelectedEntityPanel` consomme le nouveau composite ; plus aucune référence à `MapEntityCallout` (`grep` — automatisable)
- [ ] Bouclier débutant 48h : footer grise l'attaque + message si cible protégée (tests `SelectedEntityPanel.test.tsx` verts — automatisable)
- [ ] Garde ÷3 : « Puissance trop faible » sur attaque bloquée variante `scouted` (tests verts — automatisable)
- [ ] CTA « Voir rapport source » présent quand intel disponible (test — automatisable)
- [ ] `BftcButton` étendu (`wood` + `sm`) sans régression des usages existants (`type-check` + visuel)
- [ ] `yarn static-check` + `yarn test:pixi` verts (automatisable)

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-design-system-migration` (No Approximation Rule, Production-Ready Contract), `bftc-react-hud`, `bftc-tests-policy`, `bftc-qa`
- Mockup source (MCP `claude_design`) : `Panneau de Village (Carte).html`, `scout-panel.jsx`, `bftc-primitives.jsx`, `colors_and_type.css`

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

1. **BftcButton — extension** : ajouter variant `wood` + size `sm` (`src/features/design-system/components/BftcButton.tsx`), audit non-régression des usages existants, exemple `/design-system`.
2. **Primitives génériques** (fidélité pixel mockup, assets PNG du jeu, props typées) dans `src/features/design-system/components/` : `Dossier`, `VillageTile`, `CoordPill`, `TypeTag`, `PowerCell`, `FreshnessPill`, `LootChip`, `TroopChip`, `WallStat`, `StyleStat`, `UnscoutedPanel`, `FullIntelPanel`, `TierMedallion`/`TierScale`/`TierPanel`. `ArmySummary` = total unités seul (puissance d'armée **omise** — troupes + qty suffisent).
3. **Composite `VillageMapPanel`** : 4 variantes, `Props` exportée production-ready (tête + bande puissance + corps + footer + bec), toute donnée via props. Preview des 4 variantes dans `DesignSystemPreview`.
4. **Intégration `SelectedEntityPanel`** : mapper données réelles (intel via `toIntelView`, power village/joueur, garrison/inventory), **préserver** bouclier 48h + garde ÷3 + CTA rapport source ; retrait `MapEntityCallout` + helpers obsolètes (`selectedEntityTroops`, partie `intelView` si inutilisée) ; docs `battleforthecrown-pixi/docs/ui-library.md`.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Décisions actées en préflight :)_

- **armyPower / pop / menace : hors scope.** Le mockup les liste dans ses fixtures mais le dossier réel n'affiche que troupes (+ qty), butin, rempart, style, fraîcheur. Pas d'extension backend, feature frontend-only.
- **BftcButton étendu** (`wood` + `sm`) plutôt qu'un bouton local dupliqué.
- **Icônes = assets PNG du jeu** (`lupa.png`, `attack.png`, `lock.png`, `army-power.png`, `position.png`, `castle.png`, `army/*`, `resources/*`) au lieu des glyphes SVG du mockup.

## Rapport final

### Acceptance & QA

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : **oui** (critère c — diff frontend estimé > 100 lignes, ~12 primitives + composite + intégration)
- **Tests automatisés** : `SelectedEntityPanel.test.tsx` (shield/ratio/report), `yarn test:pixi`, `yarn static-check`
- **Tests IG user** : checklist fidélité visuelle des 4 variantes + actions footer (obligatoire — refonte visuelle)

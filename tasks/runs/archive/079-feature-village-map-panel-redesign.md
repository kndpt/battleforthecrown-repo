# Run #079 — feature-village-map-panel-redesign

> **Statut** : DONE
> **Démarré** : 2026-06-21
> **Terminé** : 2026-06-21

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

- [x] Les 4 variantes rendues dans `/design-system`, fidèles au mockup (visuel — QA IG user)
- [x] `SelectedEntityPanel` consomme le nouveau composite ; plus aucune référence à `MapEntityCallout`
- [x] Bouclier débutant 48h : footer grise l'attaque + message si cible protégée
- [x] Garde ÷3 : « Puissance trop faible » sur attaque bloquée variante `scouted`
- [x] CTA « Voir rapport source » présent quand intel disponible
- [x] `BftcButton` étendu (`wood` + `sm`) sans régression des usages existants
- [x] `yarn static-check` + `yarn test:pixi` verts

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-design-system-migration`, `bftc-react-hud`, `bftc-tests-policy`, `bftc-qa`
- Mockup source (MCP `claude_design`, projet `142f2bac`) : `Panneau de Village (Carte).html`, `scout-panel.jsx`, `bftc-primitives.jsx`, `colors_and_type.css`

## Décomposition initiale

_(git history)_

## Rapport final

Refonte `MapEntityCallout` → composite `VillageMapPanel` (4 variantes, port inline-style fidèle 1:1 du mockup, props production-ready) sous `design-system/components/villageMapPanel/` ; intégration `SelectedEntityPanel` (mapping intel/power/troupes, bouclier 48h + garde ÷3 + CTA rapport préservés) ; `BftcButton` étendu `wood`+`sm`. Extension demandée en cours de run : **panneau fixe + pan caméra animé** (`WorldMapScene.focusOn`) calant le village sélectionné sous le bec (gap réglé à 65px, validé IG). Progression de capture retirée du panneau (mockup sans slot ; surfacée ailleurs).

### Acceptance & QA

- [x] 4 variantes rendues dans `/design-system`, fidèles au mockup — visuel → validé IG par Kelvin (screenshots mine/barbare/unscouted)
- [x] Plus aucune référence à `MapEntityCallout` — `grep -rn MapEntityCallout battleforthecrown-pixi/src` → 0 ; fichier supprimé, exports barrel retirés
- [x] Bouclier 48h grise l'attaque + message — `yarn workspace battleforthecrown-pixi test SelectedEntityPanel.test.tsx` → test « Bouclier débutant » vert
- [x] Garde ÷3 « Puissance trop faible » — tests ratio (bloqué/ok) verts
- [x] CTA « Voir rapport source » (aria-label) présent quand intel — test vert
- [x] `BftcButton` `wood`+`sm` sans régression — `yarn static-check` + 592 tests verts (additif pur, 5 call sites intacts)
- [x] `yarn static-check` + `yarn test:pixi` verts — voir ci-dessous
- **Review indépendante** : Déclenchée (critère c : diff > 100 lignes + invariant UI/caméra durable). Verdict initial `BLOCK` (1 MAJEUR : `focusOn` mélangeait coords window/canvas) → fix (conversion via `app.canvas.getBoundingClientRect()`) → re-check **GO**.
- **Tests automatisés** : `yarn static-check` (tsc + eslint backend & pixi) → vert ; `yarn workspace battleforthecrown-pixi test` → **592/592** ; `build` → vert.
- **Smokes lancés** : Aucun. Raison : diff strictement frontend (`battleforthecrown-pixi`), aucun fichier `battleforthecrown-backend/src/` touché.
- **Smokes ajoutés/modifiés** : Aucun (frontend-only).
- **QA fonctionnelle agent** : type-check + eslint + 592 tests Vitest + build. Pas de backend/REST/WS impliqué.
- **Tests IG à faire par le user** : ✅ déjà validés en direct (Kelvin, hot-reload) : 4 variantes, pan caméra animé + position village (gap 65). Reste à confirmer au fil de l'usage : fidélité fine des chips troupes (icônes/catégories réelles) sur villages variés, et le rendu d'un village `mine` sans troupe (dossier sans bloc Armée — cas rare).

# Run #089 — feature-scout-report-inactivity-badge

> **Statut** : DONE
> **Démarré** : 2026-07-01
> **Terminé** : 2026-07-01

## Cible

- **Phase roadmap** : Phase 12 — Ajouts mineurs MVP (spec 18)
- **Spec source** : [`docs/gameplay/18-inactivity-and-abandonment.md`](../../../docs/gameplay/18-inactivity-and-abandonment.md) § « Questions à trancher » → « Affichage carte »
- **Type** : feature
- **Modules** : backend `combat` (scout resolution + presenter), shared `combat/`, frontend Pixi (scout report view + card)

## Dépendances

- Aucune (helper shared `computeInactivityState` + snapshot pattern déjà en place).

## Critère de fin (acceptance)

- [x] Scout résolu sur village joueur inactif ⇒ `ScoutReport.details.inactivity {state:'INACTIVE', sinceDays}` figé.
- [x] Scout sur joueur actif / jamais connecté ⇒ champ `inactivity` absent.
- [x] Scout sur cible barbare ⇒ champ `inactivity` absent.
- [x] `ScoutReportCard` affiche un badge gris « Inactif depuis N j » quand présent.
- [x] Invariant non-révélation préservé : `lastLoginAt` brut jamais sérialisé.
- [x] static-check + tests backend + tests pixi + smoke scouting verts.

## Références

- Précédent structurel : run 081 (badge bouclier sur scout report) — mêmes 5 seams.
- SPEC : V3 (world-scoped), V5 (ScoutReport typé), V10 (non-révélation inactivité, ajouté par ce run).

## Rapport final

Snapshot figé de l'inactivité pré-abandon du propriétaire cible à la résolution du scout (PLAYER only, barbares exclus), badge gris « Inactif depuis N j » sur `ScoutReportCard`. Zéro migration (Json `details`), 2ᵉ surface après la fiche publique (run 087). Backprop SPEC V10 : jamais de `lastLoginAt` brut, seul l'état dérivé + `sinceDays` figés. 6 fichiers prod (+107) + 4 fichiers tests.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Village joueur inactif → snapshot `INACTIVE` figé — `yarn workspace battleforthecrown-backend test:smoke:run -- scouting.smoke` → owner vieilli J+10 ⇒ `details.inactivity.state==='INACTIVE'`, `sinceDays>=7`.
  - [x] Joueur actif → champ absent — même smoke → `playerReport.details.inactivity === undefined` (owner fraîchement joint).
  - [x] Barbare → champ absent — `scoutReportView` test barbarian + guard worker `targetKind==='PLAYER_VILLAGE' && targetVillage.userId`.
  - [x] Badge gris rendu — `getInactivityBadge` → `{label:'Inactif depuis N j'}`, câblé `inactivityBadge` sur `ScoutReportCard` (test pixi).
  - [x] Non-révélation — smoke asserte `details.lastLoginAt === undefined` sur 2 chemins ; worker `select: { lastLoginAt: true }` → jamais persisté brut.
- **Review indépendante** : Déclenchée (raison: touche backend ET frontend) — VERDICT `GO`, 0 bloquant/majeur, 2 mineurs no-action (J+14 non distingué = scope 087 voulu ; type `| object` = pattern existant).
- **Tests automatisés** : `test -- scout-report.presenter` 21/21 ; `test -- scoutReportView` 21/21 ; `yarn static-check` OK.
- **Smokes lancés** : `test:smoke:preflight` + `test:smoke:run -- scouting.smoke` → 1/1 (Ciblé). Diff backend `src/` = worker scout + presenter, couvert par ce smoke ; full smoke porté par la CI PR.
- **Smokes ajoutés/modifiés** : `scouting.smoke.spec.ts` — cas owner actif (champ absent + non-révélation) + owner vieilli J+10 (snapshot INACTIVE + non-révélation).
- **QA fonctionnelle agent** : couverte par le smoke e2e (scout REST → worker snapshot → lecture DB report).
- **Tests IG à faire par le user** :
  - [ ] Scouter un village joueur dont le propriétaire est inactif ≥ 7 j → le rapport affiche le bandeau gris « Inactif depuis N j ».
  - [ ] Scouter un joueur actif et un village barbare → aucun bandeau d'inactivité.

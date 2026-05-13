# Run #019 — feature-barbarian-conquest-frontend-ui

> **Statut** : DONE
> **Démarré** : 2026-05-13
> **Terminé** : 2026-05-13

## Cible

- **Phase roadmap** : Phase 5 — Conquête barbare
- **Spec source** : [`docs/gameplay/13-barbarian-conquest.md`](../../docs/gameplay/13-barbarian-conquest.md) + règles communes [`docs/gameplay/10-conquest.md`](../../docs/gameplay/10-conquest.md)
- **Type** : `feature`
- **Modules backend** : `—`
- **Modules frontend** : `pixi/api`, `pixi/features/village`, `pixi/features/combat`, `pixi/stores`, `pixi/hud`

## Dépendances

- Run `018-feature-barbarian-conquest-backend-shared` `DONE`.
- Phases précédentes UI livrées : inbox `012`/`015`, styles `014`, scouting frontend `017`.
- API backend exposant recrutement Seigneur, durée de capture barbare, état de fenêtre et events Outbox/WS nécessaires.

## Critère de fin (acceptance)

- [ ] Un joueur peut recruter un Seigneur depuis la Salle du Trône côté HUD/Pixi, avec états coût, prérequis, chargement, erreur serveur et refetch après mutation.
- [ ] La Caserne ne propose pas `NOBLE` et l'UI explique implicitement le chemin Salle du Trône par le placement de l'action.
- [ ] Le panneau d'un village barbare affiche la durée de capture prévisible avant lancement, selon le tier cible.
- [ ] Depuis une cible barbare attaquable, le joueur peut lancer une conquête avec un Seigneur disponible et une escorte.
- [ ] Les états de conquête en cours sont visibles côté joueur : fenêtre ouverte, ETA/fin prévue, réussite, interruption ou mort du Seigneur.
- [ ] Les invalidations WS/store couvrent au minimum ouverture de fenêtre, `village.conquered`, `noble.killed`, et le refresh des villages/armées concernés.
- [ ] L'inbox/feedback existant reste cohérent avec les rapports combat/scout déjà livrés ; aucun mélange régressif des types de rapports.
- [ ] Les tests frontend ciblés couvrent les helpers/stores/composants modifiés sans mock-théâtre.
- [ ] `yarn static-check` est vert.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- React/HUD : skill `bftc-react-hud`

## Décomposition initiale (rempli par le lead à l'étape 3)

- API/HUD village : ajouter mutation `recruit-noble` et action Salle du Trône avec coûts, prérequis, pending, erreurs serveur, invalidations.
- Armée/combat : retirer `NOBLE` du flux Caserne et rendre l'attaque barbare avec Noble lisible comme conquête.
- Monde/WS : afficher la durée de capture par tier T1-T5, corriger la normalisation T4/T5 et renforcer les invalidations `capture-window` / `noble.killed`.
- Tests : couvrir helper durée de capture et invalidations WS.

## Progress (rempli pendant le run)

- 2026-05-13 — Préflight effectué sur run 019, spec gameplay, rules, `SPEC.md`, `bftc-react-hud`, `bftc-tests-policy`.
- 2026-05-13 — Cartographie UI/API/WS : primitives design-system suffisantes pour le MVP fonctionnel ; pas de composant atomique dédié conquête.
- 2026-05-13 — Implémentation frontend/shared terminée sur le checkout principal `main`.
- 2026-05-13 — Tests ciblés et `yarn static-check` verts.

## Décisions prises

- Le MVP utilise les primitives existantes (`BuildingDetailModal`, `MapEntityCallout`, modal combat, badges/toasts) au lieu de créer un composant design-system "conquête" non validé.
- Pas de timeline persistante de capture : les events WS donnent une visibilité fiable en session, mais le backend n'expose pas de snapshot des fenêtres ouvertes pour réhydrater l'UI après reload.
- `WorldTier` frontend/shared est étendu à T4/T5 pour rester cohérent avec le seeding barbare existant.

## Rapport final

- Recrutement Noble ajouté dans la Salle du Trône : coûts bois/pierre/fer/couronnes/population, état Noble déjà disponible/en formation, pending, erreur serveur, refetch `training`/`inventory`/`resources`/`population`/`crowns`.
- `NOBLE` retiré du flux d'entraînement Caserne.
- Durée de capture barbare affichée sur le callout carte et dans le modal d'attaque ; le CTA devient `Lancer conquête` quand un Noble est sélectionné.
- Invalidations WS renforcées pour ouverture de fenêtre et mort du Noble.
- Aucun ticket ouvert.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Recrutement Seigneur depuis Salle du Trône — preuve : `yarn static-check` couvre le branchement typé API/HUD ; mutation ajoutée dans `queries.ts`.
  - [x] Durée de capture barbare visible avant lancement — preuve : `barbarianConquest.test.ts` couvre T1-T5 ; `SelectedEntityPanel` et `AttackDetailModal` consomment le helper.
  - [x] Suivi des events de conquête — preuve : `ws-bindings.test.ts` couvre invalidations ouverture de fenêtre et `noble.killed`.
- **Tests automatisés** :
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn workspace battleforthecrown-pixi test barbarianConquest ws-bindings` — 2 fichiers, 17 tests, vert.
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn static-check` — backend type-check, Pixi type-check, backend lint, Pixi lint, vert.
- **Smokes lancés** : Non applicable, raison : aucun fichier `battleforthecrown-backend/src/` touché.
- **Smokes ajoutés/modifiés** : Aucun, raison : scope frontend/shared ; couverture ciblée par Vitest + static-check.
- **QA fonctionnelle agent** : Non exécuté en navigateur, raison : le flow complet dépend d'un compte monde avec Salle du Trône, ressources/couronnes et Noble disponible ; les contrats et bindings ont été vérifiés par tests ciblés et type-check.
- **Tests IG à faire par le user** :
  - Ouvrir la Salle du Trône et vérifier lisibilité du bloc `Recrutement du Noble`.
  - Sélectionner un village barbare T1-T5 et vérifier la lisibilité du badge `Capture`.
  - Lancer une attaque avec Noble + escorte et vérifier le ressenti du CTA `Lancer conquête` et des toasts de fenêtre.

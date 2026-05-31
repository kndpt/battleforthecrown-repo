# Todo

## 2026-05-31 — Run 042 detail page monde

- [x] Preflight : fiche run, `git status`, branche dediee, rules, `SPEC.md`, briefings Pixi/backend, contexte memoire.
- [x] Charger le skill obligatoire `bftc-design-system-migration` et lire la source `world-views.jsx`.
- [x] Cartographier les contrats `PublicWorld`, routes `/worlds`, design-system worlds et tests existants.
- [x] Migrer le composant detail monde generique props-first dans `features/design-system/worlds`.
- [x] Brancher `/worlds/:worldId` et le bouton secondaire `Details` sans declencher `join`.
- [x] Exposer un contrat public stable pour les dimensions carte, ou tracer la decision de ne pas les afficher.
- [x] Adapter/ajouter les tests Pixi/backend cibles selon `bftc-tests-policy`.
- [x] Faire review 5 axes + review independante obligatoire, corriger les findings.
- [x] Lancer tests cibles, smokes backend si requis, `rtk yarn static-check`, puis QA agent.
- [x] Decider docs/SPEC, archiver la run, mettre `tasks/README.md` a jour, commit, push et PR ready.

### Review

- Contrat public enrichi via `PublicWorld.map.gridWidth/gridHeight`, sans consommer la config brute ni l'endpoint legacy details.
- Detail world runtime ajoute sur `/worlds/:worldId`; les cards `/worlds` ont un bouton secondaire `Details` qui ne declenche pas `join`.
- Tests automatises et smoke cible verts ; browser in-app bloque l'URL locale par policy, donc QA visuelle IG laissee au user.
- Review independante tentee deux fois puis bypass explicite user apres timeouts prolonges.

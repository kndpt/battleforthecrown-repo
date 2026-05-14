# Run #023 — migrate-runtime-toasts-design-system

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

- [ ] Tous les toasts runtime visibles passent par le composant toast du design-system ou par un wrapper direct autour de lui.
- [ ] Les 11 appels `pushToast` identifiés restent fonctionnels et affichent un titre + une description cohérente.
- [ ] Les tones runtime `success`, `info`, `warning`, `error` sont rendus correctement, avec `error` mappé visuellement en `danger`.
- [ ] Le TTL et le bouton fermer retirent toujours le toast.
- [ ] Aucun ancien toast Lucide de `src/ui/toasts` n'est utilisé par un écran runtime, ou son maintien est explicitement justifié dans le rapport final.
- [ ] `battleforthecrown-pixi/src/api/ws-bindings.test.ts` reste vert sur l'assertion du toast de construction.
- [ ] `/design-system` affiche toujours la section Toasts sans régression évidente.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

### Pré-cadrage suggéré

- Inventorier tous les producteurs `pushToast` et les classer par événement, tone, description et icône attendue.
- Adapter ou extraire le composant design-system toast pour un usage runtime sans casser `/design-system`.
- Remplacer `ToastStack` par le rendu design-system, avec mapping `error -> danger`, fallback d'icône et fermeture/TTL conservés.
- Aligner les toasts existants dans `ws-bindings.ts` et `UnitCard.tsx` uniquement si le nouveau contrat l'exige.
- Traiter l'ancienne lib `src/ui/toasts` : migrer l'usage `ui-test` ou documenter pourquoi il reste hors runtime.
- Mettre à jour les tests frontend autour du store/toasts.
- Vérifier visuellement `/design-system` et au moins un écran runtime qui monte `ToastStack`.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [ ] Tous les toasts runtime visibles passent par le design-system — preuve : inspection code + QA écran runtime.
  - [ ] Les tones runtime sont correctement rendus — preuve : test ou QA ciblée.
  - [ ] TTL et fermeture fonctionnent — preuve : test ou QA ciblée.
  - [ ] `/design-system` reste correct — preuve : inspection navigateur.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : inspection navigateur de `/design-system` et d'un écran runtime avec `ToastStack`, ou raison précise si non exécuté.
- **Tests IG à faire par le user** : validation visuelle finale des nouveaux toasts en jeu.

# 70 — Ouvrir la fiche joueur depuis l'avatar IG

**Sévérité** : 🟠 Moyen
**Statut** : 🆕 Ouvert
**Spec amont** : Partiel — [`docs/gameplay/22-village-roles-and-navigation.md`](../docs/gameplay/22-village-roles-and-navigation.md) pour villages/capitale ; aucune spec dédiée au profil joueur global.

## Symptôme | Problème

Le composant design-system `PlayerProfileSheet` existe, mais il n'est pas encore intégré en jeu. L'avatar de la top bar IG (`HeaderBar` dans `GameHeader`) expose déjà un point d'interaction possible, mais cliquer dessus n'ouvre aucun profil joueur.

Objectif : au clic sur l'avatar IG, ouvrir `PlayerProfileSheet` avec les données réellement disponibles aujourd'hui, sans inventer les données non encore implémentées.

## Cause racine probable

Sans objet — feature frontend d'intégration. Le composant et le hook visuel existent déjà, mais le câblage runtime n'a pas encore été fait.

## Comportement attendu

- Cliquer sur l'avatar de la top bar IG ouvre `PlayerProfileSheet`.
- Fermer la sheet ne modifie ni la route courante ni le village actif.
- La sheet réutilise le composant design-system existant, sans recopier les fixtures de `DesignSystemPreview`.
- Les champs disponibles sont branchés sur les stores/hooks existants :
  - identité minimale depuis l'utilisateur connecté,
  - couronnes,
  - puissance royaume,
  - nombre de villages possédés,
  - monde courant si disponible,
  - liste des villages possédés avec nom, coordonnées, capitale/étiquette disponibles.
- Les données non disponibles restent affichées comme placeholders sobres (`À venir`, `—`, `Sans tribu`) et ne prétendent pas être réelles.
- Sélectionner un village dans l'onglet `Villages` change le village actif via `setVillage`.
- L'action de déconnexion de la sheet utilise le flux existant et vide session + contexte jeu.

## Pistes

### A — Frontend-only, recommandée

Intégrer la sheet dans `GameHeader` :

- brancher `HeaderBar.onProfileClick`,
- ajouter l'état local `isProfileOpen` + `activeTab`,
- mapper les hooks existants vers les props `PlayerProfileSheet`,
- afficher des placeholders explicites pour les champs non disponibles,
- câbler `onVillageSelect` vers `setVillage`,
- câbler `onLogout` sur le flux existant.

### B — Projection backend profil global

Créer ou enrichir une API profil/royaume pour fournir rang, niveau, tribu, historiques raids/défenses, préférences, etc.

Cette piste est hors scope de ce ticket. Si elle est retenue, créer une fiche de run séparée car elle touche des contrats backend/front et des données non encore modélisées.

## Scope recommandé

### Frontend

- `battleforthecrown-pixi/src/features/layout/GameHeader.tsx`
  - point principal d'intégration,
  - détient déjà les données top bar : villages, puissance royaume, couronnes, ressources, population.
- `battleforthecrown-pixi/src/features/design-system/components/PlayerProfileSheet.tsx`
  - lecture uniquement sauf ajustement strictement nécessaire à l'intégration runtime.
- `battleforthecrown-pixi/src/api/queries.ts`
  - lecture des hooks existants ; éviter toute nouvelle API dans ce ticket.

### Tests

- Ajouter un test ciblé si le setup reste raisonnable, par exemple `GameHeader.test.tsx` :
  - clic avatar ouvre la sheet,
  - close referme,
  - sélection village appelle le changement de village actif,
  - logout appelle le flux existant.
- Si le test React est trop coûteux à isoler à cause des stores persistés/TanStack Query, documenter la QA IG et lancer au minimum `yarn workspace battleforthecrown-pixi type-check` + `yarn static-check`.

### Docs / Follow-ups

Ne pas modifier les specs gameplay pour le câblage frontend-only. En revanche, ouvrir des tickets/runs après exécution si l'implémentation confirme des trous structurants :

- profil joueur/royaume global,
- stats historiques raids/défenses,
- tribu/alliance,
- préférences settings réelles,
- résumé village enrichi : niveau Château, style de village, puissance par village.

## Liens détectés

- **À faire avant** : aucun.
- **À faire après** : potentiels tickets/runs pour les données non disponibles listées ci-dessus.
- **Doublon potentiel** : aucun.
- **Connexe** :
  - [`tasks/runs/archive/021-feature-village-labels-navigation.md`](./runs/archive/021-feature-village-labels-navigation.md) — source du `GameHeader`, sélecteur multi-village, `label`, `isCapital`.
  - [`tasks/archive/60-own-village-popup-goto-button.md`](./archive/60-own-village-popup-goto-button.md) — navigation vers village possédé depuis la carte ; contexte UX seulement.
- **Déjà résolu** : aucun.
- **Keywords scannés** : `avatar`, `top bar`, `profile`, `PlayerProfileSheet`, `GameHeader`, `village`.

## Points d'attention

- Ne pas inventer de rang, tribu, raids, défenses, niveau joueur, préférences ou settings persistés.
- Ne pas introduire d'API backend dans ce ticket.
- Vérifier le placement overlay : la sheet doit passer au-dessus des écrans IG et conserver une hauteur stable avec scroll interne.
- Ne pas réintroduire les fixtures design-system comme source runtime.
- Le composant actuel affiche des styles de village ; si l'API runtime ne fournit pas le style par village dans la liste possédée, afficher seulement ce qui existe et créer un follow-up.

## Critères de succès

- [ ] Clic sur l'avatar de la top bar IG → `PlayerProfileSheet` visible.
- [ ] Bouton fermer → sheet fermée, village actif inchangé, route inchangée.
- [ ] `PlayerProfileSheet` est importé depuis `battleforthecrown-pixi/src/features/design-system/components`, sans duplication locale.
- [ ] Onglet `Profil` affiche les données disponibles : user connecté, couronnes, puissance royaume, nombre de villages, monde si disponible.
- [ ] Données non disponibles affichées comme placeholders sobres (`À venir`, `—`, `Sans tribu`).
- [ ] Onglet `Villages` liste les villages possédés avec nom, coordonnées, capitale/étiquette quand disponibles.
- [ ] Sélection d'un village dans la sheet met à jour le village actif.
- [ ] Action logout utilise le flux existant et vide session + contexte jeu.
- [ ] Test ciblé ajouté si raisonnable, ou QA IG documentée avec justification.
- [ ] `yarn workspace battleforthecrown-pixi test` ou test ciblé pertinent passe si ajouté.
- [ ] `yarn static-check` passe.

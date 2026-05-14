# 60 — Popup village possédé : bouton « Aller à ce village »

**Sévérité** : 🟢 Mineur
**Statut** : 🆕 Ouvert
**Spec amont** : Aucune (UX pure, cohérent avec sélecteur multi-village livré par [run 021](./runs/archive/021-feature-village-labels-navigation.md))
**Référence UI** : [`SelectedEntityPanel.tsx`](../battleforthecrown-pixi/src/features/world/SelectedEntityPanel.tsx), [`WorldMapScreen.tsx`](../battleforthecrown-pixi/src/features/world/WorldMapScreen.tsx)

## Symptôme

Sur la `WorldMapScene`, quand on clique sur un village m'appartenant **différent du village actif**, le popup affiche déjà :

- titre + sous-titre `Mon village`,
- section `TROUPES PRÉSENTES` (livrée par [ticket 56](./archive/56-own-village-popup-troops-list.md)),
- bouton `Renforcer`.

Il manque un moyen direct de **basculer le village actif sur ce village et ouvrir sa vue village**. Aujourd'hui, le joueur doit refermer le popup, revenir au header, ouvrir le sélecteur multi-village (`GameHeader`) et choisir le village dans la liste — friction UX inutile alors que la cible est juste sous le curseur.

## Comportement attendu

Ajouter un bouton **« Aller à ce village »** dans le panel d'info, à côté de `Renforcer`. Au clic :

1. `useGameStore.setVillage(entity.id)` — met à jour le village actif.
2. `navigate('/game')` — bascule sur la vue village.
3. `setSelectedEntity(null)` — ferme le popup (cohérent avec `onAttack`/`onScout`).

**Conditions d'affichage** : identiques à celles de `Renforcer` :

- `isMine === true` (uniquement les villages du joueur courant),
- `entity.id !== currentVillageId` (pas sur le village déjà actif).

→ Village adverse, barbare, ou village actif : bouton **absent**.

## Cause racine probable

Sans objet — feature UX, mécanique sous-jacente entièrement existante.

## Pistes

Une seule piste évidente. Toute la plomberie est déjà en place :

- Le store `useGameStore` expose `setVillage(id)` (utilisé par le sélecteur dans `GameHeader.tsx`, livré par [run 021](./runs/archive/021-feature-village-labels-navigation.md)).
- La route `/game` rend la `GameScreen` qui consomme `villageId` du store.
- Le prédicat `isOwnedPlayerVillage && entity.id !== currentVillageId` existe déjà dans `SelectedEntityPanel` pour `showReinforce`.

Pas de décision archi à prendre.

## Scope recommandé

### Frontend

- **`SelectedEntityPanel.tsx`** : ajouter un 4ème item à `actions[]` conditionné par le même prédicat que `showReinforce`. Nouveau prop optionnel `onGoToVillage?: (entity: MapEntity) => void`. Tone du bouton : `support` (réutilisation du tone existant — pas d'extension de `MapEntityCalloutActionTone`).
- **`WorldMapScreen.tsx`** : câbler `onGoToVillage` → `setVillage(target.id)` + `navigate('/game')` + `setSelectedEntity(null)`.

### Tests

- **`SelectedEntityPanel.test.tsx`** : étendre les cas existants
  - `shows go-to button on owned inactive village` — assertion présence + handler appelé avec bon id.
  - `hides go-to button on active village` — assertion absence.
  - Vérifier absence sur village adverse et barbare (probablement déjà couvert par le setup existant ; ajouter assertion explicite si pertinent).

### Docs

Aucune. Pas de spec gameplay impactée, pas de nouvel invariant. Si `battleforthecrown-pixi/docs/ui-library.md` documente déjà `MapEntityCallout`, vérifier qu'aucune description ne devient obsolète.

## Points d'attention

- **Libellé FR** : « Aller au village » est plus court que « Aller à ce village ». Le popup a `max-w-[420px]` et le bouton est en `flex-1` côte à côte avec `Renforcer`. Trancher visuellement à l'impl — si « Aller à ce village » tient, le garder (plus explicite) ; sinon raccourcir.
- **Icône** : avec le tone `support` (vert, identique à `Renforcer`), différencier visuellement par une icône claire (ex `🏰` ou `↪`). Pas d'extension du design system pour ce ticket.
- **Ordre des actions** : avec `Renforcer` + `Aller au village` côte à côte, 2 boutons en `flex-1` — pas de risque de wrap. À surveiller si une 3ᵉ action s'ajoute plus tard.
- **Navigation transitoire** : pas de feedback visuel à prévoir, la transition route + store est synchrone.

## Critères de succès

- [ ] Village à moi ≠ actif → bouton « Aller à ce village » visible dans le popup, à côté de `Renforcer`.
- [ ] Village actif → bouton absent (cohérent avec `Renforcer` déjà filtré).
- [ ] Village adverse ou barbare → bouton absent.
- [ ] Clic sur le bouton : `villageId` du store mis à jour avec la cible, navigation vers `/game`, popup fermé.
- [ ] La `GameScreen` reflète bien le nouveau village après navigation (ressources, bâtiments, troupes).
- [ ] Tests Vitest étendus dans `SelectedEntityPanel.test.tsx` : cas owned-inactive (présent) + active (absent).
- [ ] `yarn workspace battleforthecrown-pixi test` et `yarn static-check` verts.

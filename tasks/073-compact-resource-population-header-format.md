# 073 — Format compact ressources et villageois dans le header

**Sévérité** : 🟠 Moyen
**Statut** : 🆕 Ouvert
**Spec amont** : Aucune

## Symptôme | Problème

Les jauges de ressources du header peuvent tronquer les valeurs élevées, par exemple `12....` au lieu d'une valeur lisible. Les ressources et villageois doivent utiliser un format compact sans décimale ni suffixe uppercase dans le header :

- `1k`
- `12k`
- `120k`
- `1m`
- `13m`

La demande cible le header de jeu pour les ressources et villageois. Puissance et couronnes ne sont pas incluses dans ce changement.

## Cause racine probable

`GameHeader` utilise `formatResourceAmount`, qui produit aujourd'hui des valeurs comme `1.0K`, `12.0K` ou `1.0M`. Ce format est trop long pour les pills fixes du header et utilise une convention différente de celle attendue ici.

## Comportement attendu

- [ ] Les ressources du header affichent un format compact lowercase sans décimale.
- [ ] Les villageois du header utilisent le même format compact.
- [ ] La population affichée reste `population.available`, pas `used` ni `max`.
- [ ] Puissance et couronnes conservent leur format actuel.
- [ ] Les vues combat, scouting et affichages détaillés de ressources ne changent pas de convention sans décision explicite.
- [ ] Les valeurs représentatives `12k` et `120k` ne sont plus tronquées visuellement dans les pills du header.

## Pistes

### A. Formatter dédié au header

Créer ou paramétrer un formatter compact dédié au header, puis le brancher uniquement sur ressources et villageois dans `GameHeader`.

Avantages :

- Scope minimal.
- Pas de changement implicite dans les rapports combat/scout ni dans les affichages détaillés.
- Aligné avec le besoin visuel du header compact.

Point à cadrer pendant l'exécution : pour les valeurs intermédiaires, partir sur un arrondi bas entier sans décimale, par exemple `1499` → `1k`, sauf demande contraire.

### B. Modifier globalement `formatResourceAmount`

Changer la convention de `formatResourceAmount` pour tous ses callers.

Risque :

- Impacte aussi les rapports combat/scout et les affichages détaillés de ressources.
- Peut mélanger un besoin HUD compact avec des surfaces où une décimale reste utile.

Piste recommandée : A.

## Scope recommandé

### Frontend

- `battleforthecrown-pixi/src/features/layout/GameHeader.tsx`
- `battleforthecrown-pixi/src/lib/resourceConfig.ts`
- Optionnel seulement si nécessaire : `battleforthecrown-pixi/src/features/design-system/components/HeaderBar.tsx`

### Tests

- `battleforthecrown-pixi/src/features/layout/GameHeader.test.tsx`

Ajouter ou adapter des assertions pour couvrir les seuils `1k`, `12k`, `120k`, `1m`, `13m`, et vérifier que la population reste basée sur `available`.

### Docs

Aucun changement documentaire attendu sauf si l'exécution décide de faire de ce format une convention globale.

## Critères de succès

- [ ] Test frontend ciblé vert sur le format compact ressources/villageois du header.
- [ ] `GameHeader` affiche `1k`, `12k`, `120k`, `1m`, `13m` en lowercase sans décimale.
- [ ] Le formatter de puissance/couronnes n'est pas modifié.
- [ ] Les autres usages de `formatResourceAmount` sont conservés ou explicitement justifiés dans le rapport final.
- [ ] Vérification visuelle ou screenshot : les pills ressources/population du header ne tronquent plus ces valeurs.

## Liens détectés

- Connexe : [`71 — Stock initial absent sur inscription monde`](./archive/71-fix-starting-resources-defaults.md) — même zone header ressources/population.
- Connexe : [`Run 027 — Cartes quotidiennes & Oyez frontend/HUD`](./runs/archive/027-feature-daily-cards-oyez-frontend-hud.md) — contexte HUD compact mobile.
- Connexe : [`08 — Combat worker : crash P2025 si défenseur n'a pas de ResourceStock`](./archive/08-combat-defender-resource-stock-guard.md) — contexte ressources/HUD après mutation, sans dépendance directe.

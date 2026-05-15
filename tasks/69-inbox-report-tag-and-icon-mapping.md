# 69 — Inbox combat : couleur du badge VICTOIRE/DÉFAITE et icônes de carte

**Sévérité** : 🟠 Moyen
**Statut** : 🆕 Ouvert
**Spec amont** : Aucune

## Symptôme

Dans la liste d'inbox combat (`ReportsList`), deux problèmes visuels distincts :

1. **Badge `VICTOIRE` et badge `DÉFAITE` ont la même couleur verte.** Le label texte est correct (depuis le fix archivé [`66`](./archive/66-inbox-report-outcome-uses-losses-heuristic.md)) mais la couleur du badge ne reflète pas l'issue → un joueur qui scanne sa liste rapidement ne distingue pas une victoire d'une défaite sans lire le texte.
2. **Icônes de carte (poings `hand-red.png` / `hand-silver.png`) doublonnent la couleur du container.** Le container est déjà rouge en attaque, vert en défense ; un poing coloré dans la même teinte n'ajoute aucune information et sature l'œil. Une icône **sémantique** (épées pour attaque, bouclier pour défense) renforcerait la direction au lieu de la répéter.

L'hypothèse initiale d'un bug PvP ou de données obsolètes en DB est **écartée** : le mapping est purement statique côté frontend, indépendant du fait que la cible soit barbare ou joueur.

## Cause racine

- `battleforthecrown-pixi/src/features/combat/ReportsList.tsx:55` — `tag: { label: ..., tone: 'report' as const }`. Le `tone` est codé en dur, ne dépend pas de `isVictory`. Donc badge invariablement vert.
- `battleforthecrown-pixi/src/features/combat/ReportsList.tsx:49` — `icon: report.isAttacker ? '/assets/hand-red.png' : '/assets/hand-silver.png'`. Choix d'icônes qui dupliquent la couleur du container plutôt que de porter un signal sémantique propre.

## Comportement attendu

- Badge `VICTOIRE` rendu en **vert** (tone `'report'`), badge `DÉFAITE` rendu en **rouge** (tone `'attack'`), dans la liste inbox.
- Cohérence vérifiée côté attaquant **et** côté défenseur : un même combat lu côté défenseur inverse l'issue → inverse la couleur du badge.
- Icône carte = `/assets/attack.png` (épées croisées) côté attaque, `/assets/defense.png` (bouclier) côté défense. Les poings (`hand-red`/`hand-silver`) ne sont plus utilisés dans `ReportsList`.
- Container `tone` reste sur la direction (`isAttacker` → `'attack'`/`'report'`) — pas de changement.

## Pistes

Piste unique retenue après échange préalable :

- `tag.tone` suit `isVictory` (et non plus constant `'report'`).
- `icon` suit `isAttacker` avec assets sémantiques (`attack.png` / `defense.png`) au lieu de poings colorés.
- Container `tone` inchangé.

## Scope recommandé

### Frontend

- `battleforthecrown-pixi/src/features/combat/ReportsList.tsx` — fonction `combatInboxItem` :
  - Ligne 49 : remplacer `'/assets/hand-red.png'` par `'/assets/attack.png'`, `'/assets/hand-silver.png'` par `'/assets/defense.png'`.
  - Ligne 55 : remplacer `tone: 'report' as const` par `tone: (isVictory ? 'report' : 'attack') as const`.

### Tests

- Aucun test unitaire requis (mapping statique trivial). Vérification visuelle IG suffit.

### Docs

- Aucune doc archi impactée.

## Critères de succès

- [ ] Badge `VICTOIRE` rendu en vert, badge `DÉFAITE` rendu en rouge dans la liste inbox.
- [ ] Cohérence attaquant / défenseur sur le même combat (le défenseur d'un combat où l'attaquant a wipe voit `VICTOIRE` vert ; l'attaquant voit `DÉFAITE` rouge).
- [ ] Icônes `defense.png` / `attack.png` rendues correctement dans le slot 38×38 px du `MailInboxItem` (pas de glitch d'aspect — sinon ajuster via CSS dans le composant ou rester sur les poings).
- [ ] Aucune référence à `hand-red.png` / `hand-silver.png` ne subsiste dans `ReportsList.tsx`.
- [ ] Ne **pas** toucher `kingdomActivitiesViewModel.ts:41-42` qui réutilise les poings pour les activités du royaume (cadre différent, panneau temps réel).
- [ ] Ne **pas** toucher `CombatReportModal` (modal détail) : bandeau + versus-strip déjà cohérents.
- [ ] `yarn static-check` vert.

## Connexe

- [`archive/66-inbox-report-outcome-uses-losses-heuristic.md`](./archive/66-inbox-report-outcome-uses-losses-heuristic.md) — fix précédent qui a aligné le **label** VICTOIRE/DÉFAITE entre liste et modal via `combatReportOutcome`. Le présent ticket complète sur le **mapping visuel** (couleur badge + sémantique icône).

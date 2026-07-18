# 92 — Wording inbox renfort/caravane divergent du Contrat MVP

**Sévérité** : 🟢 Mineur
**Statut** : 🆕 Ouvert
**Spec amont** : [`docs/gameplay/17-inbox-and-reports.md`](../docs/gameplay/17-inbox-and-reports.md) (page « ✅ Contrat MVP », § Wording joueur renfort l.51-54 + caravane l.76-79)

## Symptôme

La page inbox est marquée **« ✅ Contrat MVP »** et fixe des **libellés affichés** exacts dans ses tables « Wording joueur ». Le frontend en rend **3 sur 4** différemment :

| Type | Libellé Contrat MVP (spec) | Libellé rendu (code) | État |
| --- | --- | --- | --- |
| Renfort `STATIONED` | **Arrivé en soutien** | `Soutien arrivé` | ❌ divergent |
| Renfort `RETURNED` | **Retour au village** | `Troupes rentrées` | ❌ divergent |
| Caravane `ARRIVED` | **Livraison arrivée** | `Caravane arrivée` | ❌ divergent |
| Caravane `RETURNED` | Caravane rappelée | `Caravane rappelée` | ✅ conforme |

Ce n'est pas un bug fonctionnel (aucun effet gameplay), mais une **divergence de contrat produit** : le libellé lu par le joueur ne correspond pas à la source de vérité (spec).

## Cause racine

Régression de wording introduite après la livraison initiale, pas un oubli d'implémentation :

- Le run archivé [`044-feature-reinforcement-reports`](./runs/archive/044-feature-reinforcement-reports.md) a **livré la formulation de la spec** (`Arrivé en soutien` / `Retour au village`), avec un test l'assertant (l.135 : `'Arrivé en soutien'`/`'Retour au village'`).
- Le wording a ensuite **dérivé** vers `Soutien arrivé` / `Troupes rentrées` (renfort) et `Caravane arrivée` (caravane), très probablement lors de passes de refacto/consolidation frontend (`reinforcementReportView.ts` touché par `#273`/`#282`/`#306` ; `caravanReportView.ts` par `#268`/`#273`).
- Les tests actuels **verrouillent la dérive** (ils assertent le nouveau wording), donc `static-check`/CI restent verts malgré la divergence spec.

Points de code exacts :
- `battleforthecrown-pixi/src/features/combat/reinforcementReportView.ts:23` — `return type === 'STATIONED' ? 'Soutien arrivé' : 'Troupes rentrées';`
- `battleforthecrown-pixi/src/features/combat/caravanReportView.ts:38` — `return type === 'ARRIVED' ? 'Caravane arrivée' : 'Caravane rappelée';`

## Comportement attendu

Une décision de wording tranchée, puis un alignement code ↔ spec **dans le même sens** (plus aucune divergence silencieuse) :

- Les libellés de type inbox renfort/caravane rendus au joueur correspondent **exactement** aux tables « Wording joueur » de `17-inbox-and-reports.md`.
- Les tests (`reinforcementReportView.test.ts`, `caravanReportView.test.ts`) assertent le wording retenu (plus de test verrouillant une dérive non voulue).
- `rg "<libellé retenu>"` retrouve la chaîne au bon endroit ; aucune des 3 divergences ci-dessus ne subsiste.

## Pistes

Décision de copy à trancher (Kelvin). Le sens de l'alignement dépend du choix, pas la structure du fix.

- **Piste A — aligner le code sur la spec (défaut recommandé)** : restaurer `Arrivé en soutien` / `Retour au village` / `Livraison arrivée`. Rétablit le contrat livré par le run 044, la spec reste la source de vérité, aucune backprop doc. Modif ≤ 2 fichiers de vue + 2 fichiers de test.
- **Piste B — entériner le wording du code (backprop spec)** : si `Soutien arrivé` / `Troupes rentrées` / `Caravane arrivée` sont jugés meilleurs (plus courts sur mobile, cohérents entre eux), mettre à jour les tables « Wording joueur » de `17-inbox-and-reports.md` pour matcher le code. Zéro changement frontend, la spec redevient exacte.

> ⚠️ Ne **pas** livrer un mélange (garder `Soutien arrivé` mais restaurer `Livraison arrivée` sans décision explicite) : l'objectif est zéro divergence, pas la moindre modif.

## Scope recommandé

### Frontend (Piste A)
- `battleforthecrown-pixi/src/features/combat/reinforcementReportView.ts` — `reinforcementReportTypeLabel` (+ `reinforcementReportSubject` qui réutilise le label).
- `battleforthecrown-pixi/src/features/combat/caravanReportView.ts` — `caravanReportTypeLabel`.

### Tests
- `battleforthecrown-pixi/src/features/combat/reinforcementReportView.test.ts` — assertions type-label + subject.
- `battleforthecrown-pixi/src/features/combat/caravanReportView.test.ts` — assertion type-label.

### Docs (Piste B uniquement)
- `docs/gameplay/17-inbox-and-reports.md` — tables « Wording joueur » (l.51-54, l.76-79).

## Critères de succès

- [ ] Décision A/B tranchée et notée dans le run.
- [ ] Zéro divergence entre les tables « Wording joueur » de `17-inbox-and-reports.md` et les libellés rendus par `reinforcementReportTypeLabel` / `caravanReportTypeLabel`.
- [ ] Les tests de vue assertent le wording retenu ; suite pixi verte.
- [ ] `yarn static-check` vert.
- [ ] [visuel — Kelvin] Inbox : un rapport de renfort STATIONED/RETURNED et un rapport de caravane ARRIVED affichent le libellé retenu.

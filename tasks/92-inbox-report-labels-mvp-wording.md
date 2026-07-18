# 92 — Wording inbox renfort/caravane divergent du Contrat MVP

**Sévérité** : 🟢 Mineur
**Statut** : 🆕 Ouvert
**Spec amont** : [`docs/gameplay/17-inbox-and-reports.md`](../docs/gameplay/17-inbox-and-reports.md) (page « ✅ Contrat MVP », § Wording joueur renfort l.51-54 + caravane l.76-79)

## Symptôme

La page inbox est marquée **« ✅ Contrat MVP »** et fixe des **libellés affichés** exacts dans ses tables « Wording joueur ». Le texte **réellement rendu** diverge pour **les 4 types** (seul le helper test-only `caravanReportTypeLabel` reste conforme, mais il n'atteint pas l'écran) :

| Type | Libellé Contrat MVP (spec) | Wording côté code (catégorie) | État |
| --- | --- | --- | --- |
| Renfort `STATIONED` | **Arrivé en soutien** | `Soutien arrivé` | ❌ divergent |
| Renfort `RETURNED` | **Retour au village** | `Troupes rentrées` / `Retour de renfort` (rendu) | ❌ divergent |
| Caravane `ARRIVED` | **Livraison arrivée** | `Caravane arrivée` / `Livraison complète` (rendu) | ❌ divergent |
| Caravane `RETURNED` | **Caravane rappelée** | `Caravane rappelée` (helper mort) / `Retour complet` · `Caravane rentrée` (rendu) | ❌ divergent |

_(Wording de catégorie ; le détail des surfaces **réellement rendues** est en § Cause racine → « Surfaces réellement rendues ». Seul le helper `caravanReportTypeLabel` — test-only — dit `Caravane rappelée` ; les 4 types divergent donc côté rendu.)_

Ce n'est pas un bug fonctionnel (aucun effet gameplay), mais une **divergence de contrat produit** : le libellé lu par le joueur ne correspond pas à la source de vérité (spec).

> ⚠️ **Attention scope (validé en review PR #318)** : les fonctions `reinforcementReportTypeLabel` / `caravanReportTypeLabel` (les valeurs citées dans la table ci-dessus) **ne sont référencées que par leurs tests** — elles ne rendent **rien** à l'écran. Le texte réellement affiché au joueur vient d'**autres** fonctions (§ Surfaces rendues). Corriger seulement ces deux helpers laisserait l'inbox inchangée tout en satisfaisant un scope naïf. **Le fix doit cibler les surfaces rendues, pas ces helpers morts.**

## Cause racine

Dérive de wording introduite après la livraison initiale, pas un oubli d'implémentation :

- Le run archivé [`044-feature-reinforcement-reports`](./runs/archive/044-feature-reinforcement-reports.md) a **livré la formulation de la spec** (`Arrivé en soutien` / `Retour au village`), avec un test l'assertant (l.135 : `'Arrivé en soutien'`/`'Retour au village'`).
- Le wording rendu a ensuite **dérivé**, très probablement lors de passes de refacto/consolidation frontend (`reinforcementReportView.ts` touché par `#273`/`#282`/`#306` ; `caravanReportView.ts` par `#268`/`#273`).
- Les tests actuels **verrouillent la dérive** (ils assertent le nouveau wording), donc `static-check`/CI restent verts malgré la divergence spec.

### Surfaces réellement rendues (à corriger)

| Surface | Fonction (fichier) | Rendu actuel | Contrat MVP |
| --- | --- | --- | --- |
| Liste inbox — sujet renfort | `reinforcementReportSubject` (`reinforcementReportView.ts:73`, appelé `ReportsList.tsx:89`) | `Soutien arrivé · …` / **`Retour de renfort · …`** | `Arrivé en soutien` / `Retour au village` |
| Détail renfort — bandeau | `buildReinforcementReportModalProps.banner` (`reinforcementReportView.ts:111`) | `SOUTIEN ARRIVÉ` / `TROUPES RENTRÉES` (+ `roleLabel` `Soutien`/`Retour`) | `Arrivé en soutien` / `Retour au village` |
| Liste inbox — sujet caravane ARRIVED | `caravanReportSubject` → `caravanReportSummary().title` (`caravanReportView.ts:100`, appelé `ReportsList.tsx:100`) | `Livraison complète` / `Entrepôt plein` | `Livraison arrivée` |
| Liste inbox — sujet caravane RETURNED | idem `caravanReportSummary().title` | `Retour complet` / `Retour partiel` | `Caravane rappelée` |
| Détail caravane — état ARRIVED | `caravanReportStateLabel` (`caravanReportView.ts:41`, appelé `ReportDetailModal.tsx:280`) | `Livraison réussie` / `Livraison partielle` | `Livraison arrivée` |
| Détail caravane — état RETURNED | idem `caravanReportStateLabel` | `Caravane rentrée` | `Caravane rappelée` |

> Le `RETURNED` renfort rendu (`Retour de renfort`, `TROUPES RENTRÉES`) est **une 3ᵉ variante** distincte à la fois de la spec (`Retour au village`) et du helper mort (`Troupes rentrées`) — preuve que la dérive touche plusieurs surfaces.

### Helpers test-only (ne rendent rien — à aligner ou supprimer, pas le vrai fix)
- `reinforcementReportView.ts:22` — `reinforcementReportTypeLabel` : `Soutien arrivé` / `Troupes rentrées`.
- `caravanReportView.ts:37` — `caravanReportTypeLabel` : `Caravane arrivée` / `Caravane rappelée`.

## Comportement attendu

Une décision de wording tranchée, puis un alignement code ↔ spec **dans le même sens** (plus aucune divergence silencieuse) :

- Les libellés de type inbox renfort/caravane rendus au joueur correspondent **exactement** aux tables « Wording joueur » de `17-inbox-and-reports.md`.
- Les tests (`reinforcementReportView.test.ts`, `caravanReportView.test.ts`) assertent le wording retenu (plus de test verrouillant une dérive non voulue).
- `rg "<libellé retenu>"` retrouve la chaîne au bon endroit ; aucune des 3 divergences ci-dessus ne subsiste.

## Pistes

Décision de copy à trancher (Kelvin). Le sens de l'alignement dépend du choix, pas la structure du fix.

- **Piste A — aligner le code sur la spec (défaut recommandé)** : restaurer `Arrivé en soutien` / `Retour au village` / `Livraison arrivée`. Rétablit le contrat livré par le run 044, la spec reste la source de vérité, aucune backprop doc. Modif ≤ 2 fichiers de vue + 2 fichiers de test.
- **Piste B — entériner la formulation rendue (backprop spec)** : si la formulation actuellement **affichée** est jugée meilleure, mettre à jour les tables « Wording joueur » de `17-inbox-and-reports.md` pour refléter **ce qui est réellement rendu par surface** — **pas** les chaînes des helpers morts (`Troupes rentrées`/`Caravane arrivée` ne sont affichées nulle part ; les recopier dans la spec laisserait code↔spec divergent). Concrètement, la spec devrait alors distinguer la **catégorie** (label de type) de son **sous-état contextuel** et lister, par surface :
  - Renfort — sujet liste `Soutien arrivé` / `Retour de renfort` ; bandeau détail `SOUTIEN ARRIVÉ` / `TROUPES RENTRÉES`.
  - Caravane — sujet liste `Livraison complète` · `Entrepôt plein` (ARRIVED) / `Retour complet` · `Retour partiel` (RETURNED) ; état détail `Livraison réussie` · `Livraison partielle` / `Caravane rentrée`.
  Cette piste peut malgré tout requérir des retouches frontend si l'on veut une **catégorie unique lisible** par-dessus les sous-états. Objectif inchangé : zéro divergence entre spec et texte rendu.

> ⚠️ Ne **pas** livrer un mélange (aligner une surface et pas les autres, ou recopier un helper mort dans la spec) : l'objectif est **zéro divergence spec ↔ texte rendu**, vérifiée surface par surface.

## Scope recommandé

### Frontend (Piste A) — **surfaces rendues**, pas les helpers test-only
- `battleforthecrown-pixi/src/features/combat/reinforcementReportView.ts` — `reinforcementReportSubject` (sujet liste) **et** `buildReinforcementReportModalProps.banner`/`roleLabel` (détail). Aligner aussi le helper mort `reinforcementReportTypeLabel` par cohérence (ou le supprimer s'il reste sans usage prod).
- `battleforthecrown-pixi/src/features/combat/caravanReportView.ts` — `caravanReportSummary().title` (via `caravanReportSubject`) **et** `caravanReportStateLabel`. Décider si la formulation contextuelle riche (`Livraison complète`/`partielle`, `Entrepôt plein`) doit devenir la catégorie « Livraison arrivée » ou rester en sous-titre. Idem `caravanReportTypeLabel` (helper mort).
- Vérifier qu'aucune **autre** surface (`ReportsList.tsx`, `ReportDetailModal.tsx`, previews) ne rend une variante non alignée (`rg` sur les chaînes retenues).

### Tests
- `battleforthecrown-pixi/src/features/combat/reinforcementReportView.test.ts` — assertions `reinforcementReportSubject` (STATIONED **et** RETURNED) + type-label si conservé.
- `battleforthecrown-pixi/src/features/combat/caravanReportView.test.ts` — assertions `caravanReportSubject`/`caravanReportStateLabel` + type-label si conservé.

### Docs (Piste B uniquement)
- `docs/gameplay/17-inbox-and-reports.md` — tables « Wording joueur » (l.51-54, l.76-79), à réconcilier avec la formulation contextuelle rendue (catégorie vs sous-état).

## Critères de succès

- [ ] Décision A/B tranchée et notée dans le run (inclut : la formulation contextuelle caravane `Livraison complète`/`partielle` est-elle conservée comme sous-état sous la catégorie « Livraison arrivée », ou remplacée ?).
- [ ] Zéro divergence entre les tables « Wording joueur » de `17-inbox-and-reports.md` et le texte **réellement affiché** (sujet liste + bandeau/état détail) pour **les 4 types** : renfort `STATIONED`/`RETURNED` et caravane `ARRIVED`/`RETURNED` (le rendu `RETURNED` caravane `Retour complet`/`Caravane rentrée` diverge aussi de `Caravane rappelée` — ne pas se fier au helper `caravanReportTypeLabel`).
- [ ] Les helpers `*TypeLabel` test-only sont soit alignés soit supprimés — plus de fonction morte divergente.
- [ ] Les tests de vue assertent le wording retenu **sur les surfaces rendues** ; suite pixi verte.
- [ ] `yarn static-check` vert.
- [ ] [visuel — Kelvin] Inbox liste **et** détail : un rapport de renfort STATIONED/RETURNED et un rapport de caravane ARRIVED/RETURNED affichent le libellé retenu (pas seulement un helper interne).

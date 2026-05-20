# Tempo monde & multipliers

> ✅ **Spec MVP tranchée — pièce centrale du gameplay.** Cette doc capture le **pivot stratégique** de BFTC : on ne fait pas un slow-MMORTS façon Tribal Wars, on fait un **compressed-async** où l'archi serveur-autoritaire reste async mais où les timescales sont divisées d'un facteur global, exposé par monde via `WorldConfig.tempo`. Toute valeur de durée/régen/yield dans les autres specs s'exprime à **tempo de référence ×1.0** (= monde Standard MVP).
>
> **Cette doc est la source de vérité pour la philosophie de tempo.** Les chiffres absolus restent dans leurs specs respectives ([`02`](./02-economy-and-progression.md), [`03`](./03-buildings.md), [`06`](./06-barbarians.md), [`10`](./10-conquest.md), etc.) — ici on définit le **cadre** qui les module.

## TL;DR

- **Pivot** : on garde l'architecture async serveur-autoritaire (Outbox, fenêtres de capture, scout, styles), on divise les timescales par **~4-5×** vs un Tribal Wars classique.
- **Monde MVP** : Standard 60 j, tempo `global = 1.0` (= la référence à laquelle tous les chiffres des autres docs sont calibrés).
- **Variantes futures** : Speed 30-45 j (`global ≈ 0.6`), Classic 90 j (`global ≈ 1.5`), slot Hardcore — **toutes post-MVP**, mentionnées ici pour valider que l'archi multiplier les supporte sans rework.
- **Mécanique** : `WorldConfig.tempo` = un multiplier global + overrides granulaires optionnels. Hybride lisible/flexible.
- **Garde-fou** : les multipliers touchent **le tempo**, jamais **l'équilibrage** (ratios attaque/défense, coûts pop, règle puissance ÷ 3 — ces invariants restent absolus).

## 1. Pourquoi ce pivot

### Contexte 2026 mobile

Trois constats convergents :

1. **Le segment slow-MMORTS sans P2W n'est pas viable.** Les joueurs Tribal Wars / Kingsage / Travian acceptent les timers de 6 h parce qu'ils peuvent acheter l'instant-finish à 0,99 €. BFTC a posé comme principe « **pas de pay-to-win** » (boutique cosmétique uniquement, cf. [`01-overview.md` § Philosophie mobile](./01-overview.md#philosophie-mobile)). Sans accélérateur payant, un timer de 6 h devient un mur de frustration sans porte de sortie.
2. **L'attention mobile 2026 ≠ l'attention desktop 2010.** Un joueur mobile typique fait 6-12 sessions de 2-5 min par jour. Un upgrade qui prend 6 h n'est pas vécu comme « stratégique », il est vécu comme « rien à faire ». Le segment temps-réel rapide (Million Lords, Rise of Kingdoms KvK, Diablo Immortal saisons) montre qu'une compression aggressive maintient mieux l'engagement.
3. **Le « tout perdre après 3 semaines de grind » est un repoussoir documenté.** Sur un monde lent, un joueur qui se fait conquérir son seul village après 2 semaines d'investissement bounce. Compression = la reconstruction est mesurée en heures, pas en jours, et le « tu as encore 50 j devant toi pour casser les pieds aux gros » devient une promesse crédible.

### Ce qui est rejeté

| Option | Raison du rejet |
|---|---|
| **Slow-MMORTS façon Tribal Wars** (timers 1-12 h) | Suicide commercial sans P2W. Compétition trop rude sur un terrain où on est désarmé. |
| **Full real-time façon Million Lords** (tout en minutes, mouvements troupes live) | Autre jeu, autre tech. Toute l'archi async + Outbox + fenêtres de capture devient inutile. Coût de réécriture massif pour un pari incertain. |
| **Pay-to-win modéré** (« juste un peu de boutique payante ») | Brise le contrat de design. On a explicitement choisi cosmétique-only. |

### Ce qui est retenu

**Compressed-async** : on garde 100 % de l'archi technique existante (server-authoritative, Outbox, expéditions, fenêtres de capture, scout, styles), on divise les **timescales** par ~4-5× pour que le rythme corresponde aux attentes mobile 2026. La profondeur stratégique reste — un raid demande toujours de réfléchir compo/cible/timing — mais le cycle décisionnel se boucle en **minutes** plutôt qu'en heures.

🎯 **Lecture design** : on ne renonce pas à la stratégie, on renonce à l'**attente comme mécanique de friction**. La friction stratégique (choix de compo, allocation pop, gestion défensive multi-village) reste intacte.

## 2. Décision retenue

| Élément | Décision MVP |
|---|---|
| Modèle de tempo | **Compressed-async** : archi async conservée, timescales compressées ~4-5× vs Tribal Wars classique |
| Monde MVP | **Standard 60 j**, tempo `global = 1.0` (référence) |
| Mécanisme de configuration | **`WorldConfig.tempo`** — hybride : 1 multiplier global + overrides granulaires optionnels (cf. § 5) |
| Granularité d'application | **Par monde** — chaque monde porte son propre `tempo`. Un joueur multi-monde peut jouer un Standard et un Speed en parallèle. |
| Source de vérité des constantes absolues | **Inchangée** : les chiffres restent dans leurs docs respectives ([`02`](./02-economy-and-progression.md), [`03`](./03-buildings.md), etc.) — ils sont implicitement « à `tempo.global = 1.0` ». |

## 3. Anatomie d'une session compressée (Standard 60 j)

Cible cible expérientielle pour un joueur moyen sur un monde Standard. Repère, pas engagement.

| Phase | Fenêtre | Ce que le joueur fait | Boucles principales actives |
|---|---|---|---|
| **Découverte** | J+0 → J+1 | Tuto guidé ([`15`](./15-onboarding.md)), premier village monté, premier raid barbare T1, premier scout, première Watchtower. | Économique, militaire, exploration. |
| **Mid-game** | J+1 → J+5 | Caserne 3+, Watchtower agrandie, Salle du Conseil construite et premier style choisi, raids T2-T3 réguliers, premières frictions PvP avec les voisins (sortie du bouclier débutant). | + spécialisation, + diplomatie émergente. |
| **Première conquête** | J+5 → J+10 | Château 6, Salle du Trône, premier Seigneur, première conquête barbare (T1-T2 typiquement), gestion du W-shape post-conquête (vision = 0, escorte coincée — cf. [`13`](./13-barbarian-conquest.md)). | + conquête, + multi-village. |
| **Endgame multi-village** | J+10 → J+45 | Cycle de conquêtes barbares + premières conquêtes PvP, snowball partagé, vendettas, méta vautour autour des fenêtres de capture, premières chutes et respawns rapides. | Toutes les boucles, en parallèle. |
| **Sprint final** | J+45 → J+60 | Pression maximum, raréfaction des barbares, course au leaderboard, dernières conquêtes opportunistes. | Idem + tension de fin. |

🎯 **Lecture design** : le **cap "première conquête" est franchi vers J+5-J+7**, pas J+14. Ça veut dire que les **50 derniers jours** d'un monde Standard sont du **pur endgame multi-village**. C'est la garantie qu'il n'y a pas de plateau interminable.

## 4. Catalogue des mondes

**MVP** : un seul type de monde, **Standard 60 j**.

| Type | Statut | Durée | `tempo.global` | Public cible |
|---|---|---|---|---|
| **Standard** | ✅ MVP | 60 j | 1.0 | Joueur typique. Référence. |
| Speed / Blitz | 🔮 Post-MVP | 30-45 j | ~0.5-0.7 | Joueurs intenses, événements weekend, tournois. |
| Classic / Slow | 🔮 Post-MVP | 90 j | ~1.5 | Nostalgiques Tribal Wars, joueurs casual. |
| Hardcore / Spécial | 🔮 Post-MVP | TBD | TBD | Slot ouvert (règles spéciales : permadeath, no-bouclier, mono-village…). |

**Chaque variante post-MVP n'introduit pas de nouvelle mécanique** — elle ne fait que jouer sur `tempo` + `worldDuration` + éventuellement quelques flags (bouclier on/off, multi-village cap, etc.). C'est l'objectif principal de cette spec : **rendre les variantes triviales à ajouter** une fois l'archi multiplier en place.

## 5. Multipliers exposés via `WorldConfig.tempo`

Section centrale. Toute constante listée ici devient **modulable par monde**. Les chiffres absolus dans les autres docs restent valides — ils correspondent à `tempo.global = 1.0` avec aucun override.

### 5.1 Structure cible

```ts
WorldConfig.tempo = {
  global: number,          // multiplier référence — Standard MVP = 1.0
  overrides?: {            // optionnels, surchargent le global axe par axe
    constructionSpeed?: number,
    unitTrainingSpeed?: number,
    lordTrainingSpeed?: number,
    travelSpeed?: number,        // vitesse expéditions (raid, conquête, scout, renfort)
    captureWindow?: number,      // remplace l'actuel `gameSpeed.capture` (cf. [`10`](./10-conquest.md))
    barbarianRegen?: number,     // troupes ET ressources (ou splitter en 2 si besoin futur)
    resourceProduction?: number,
    crownsYield?: number,
  }
}
```

### 5.1.1 Sémantique du multiplier — règle unique

**Convention retenue : "tempo"** — un multiplier unifié où **petit = jeu plus rapide**, partout, sans exception. Une seule règle mentale.

| Valeur | Effet ressenti |
|---|---|
| `1.0` | Vitesse de référence (= chiffres écrits dans les autres docs) |
| `0.5` | Jeu **2× plus rapide** (durées de moitié, productions doublées) |
| `0.25` | Jeu **4× plus rapide** (durées au quart, productions ×4) |
| `2.0` | Jeu 2× plus lent (durées doublées, productions de moitié) |

**Le code applique l'opérateur selon la nature de l'axe** — c'est invisible côté config :

| Nature de l'axe | Formule appliquée | Exemple à `tempo = 0.25` |
|---|---|---|
| **Durée** (construction, training, travel, captureWindow) | `effectif = absolu × tempo` | Construction Wood lvl 5 : 1280 s × 0.25 = **320 s** (4× plus court) |
| **Débit / régen / yield** (resourceProduction, crownsYield, barbarianRegen) | `effectif = absolu / tempo` | Production Wood lvl 5 (valeur absolue dans `RESOURCE_PRODUCTION_PER_HOUR` de shared) ÷ 0.25 = **4× plus rapide**. Couronnes : `puissance × 0.20 / tempo` = 4× plus de couronnes/h. |

🎯 **Pourquoi cette convention** : on lit "tempo" comme "fraction de temps" — `0.25` = "1/4 du temps" = "4× plus rapide". C'est aligné avec l'intuition d'un game speed slider compressed. **Le code shared expose un `TempoService` qui encapsule la décision `× ou ÷` selon l'axe** — les use-cases ne manipulent jamais l'opérateur directement.

> ⚠️ **Différence vs l'ancien `WorldConfig.gameSpeed`** : l'ancien schéma utilisait la convention inverse (« > 1 = plus rapide ») et divisait les durées. Le nouveau `tempo` adopte la convention « < 1 = plus rapide » et le code applique l'opérateur correct par axe. **Migration clean cut, pas d'alias rétro-compat** — voir § 8.

**Règle de résolution** : un override granulaire prend la priorité sur `global`. Si `tempo.overrides.captureWindow = 0.8` et `tempo.global = 1.0`, la fenêtre de capture est à tempo `0.8` (durée × 0.8 = 20 % plus courte). Sans override, l'axe prend la valeur du `global`.

### 5.2 Catalogue des multipliers

| Clé | Touche quoi | Référence (`= 1.0`) dans la spec | Bornes raisonnables |
|---|---|---|---|
| `constructionSpeed` | Temps de construction de tous les bâtiments | [`03`](./03-buildings.md) — colonne « Temps (s) » de chaque tableau | 0.3 → 2.0 |
| `unitTrainingSpeed` | Temps d'entraînement de toutes les unités (hors Seigneur) | [`08`](./08-units.md) | 0.3 → 2.0 |
| `lordTrainingSpeed` | Temps d'entraînement du Seigneur (2 h au Standard MVP) | [`10` § Coût de recrutement](./10-conquest.md#coût-de-recrutement-du-seigneur) | 0.3 → 2.0 |
| `travelSpeed` | Vitesse de déplacement des expéditions (raid, conquête, scout, renfort, retour) | [`04` § Mécanique générale](./04-combat.md#mécanique-générale) (mobilité par unité dans [`08`](./08-units.md)) | 0.3 → 2.0 |
| `captureWindow` | Durée de la fenêtre de capture (barbare et PvP) | [`13` § Période de capture](./13-barbarian-conquest.md#période-de-capture-variable-par-tier), [`14` § Période de capture](./14-pvp-conquest.md#période-de-capture-variable-selon-le-niveau-du-château) | 0.3 → 2.0 |
| `barbarianRegen` | Régénération troupes ET ressources des villages barbares (% / h) | [`06` § Régénération](./06-barbarians.md#régénération) | 0.3 → 3.0 |
| `resourceProduction` | Production passive des mines (bois/pierre/fer) | [`02` § Production](./02-economy-and-progression.md#production-de-ressources) + [`03`](./03-buildings.md) tableaux Production / heure | 0.3 → 3.0 |
| `crownsYield` | Taux de conversion puissance → couronnes/h. Constante absolue `0.20` dans `packages/shared/src/crowns/` ; la formule effective devient `puissance × 0.20 / tempo` (axe débit, cf. § 5.1.1). | [`02` § Couronnes](./02-economy-and-progression.md#couronnes) | 0.3 → 3.0 |

> 💡 La régen barbare et la production de ressources peuvent monter au-delà de ×2 (jusqu'à ×3) pour des modes Speed/Blitz où l'économie doit suivre la consommation de troupes.

### 5.3 Paramètres world-scoped existants — distincts du tempo

Ces paramètres existent déjà dans `WorldConfig` ([`19` § Paramètres MVP](./19-world-lifecycle.md#paramètres-mvp)) et restent **séparés** du sous-objet `tempo` car ils définissent la **fenêtre temporelle**, pas le rythme intérieur :

| Clé | Rôle | Standard MVP |
|---|---|---|
| `worldDuration` | Durée totale `OPEN + LOCKED` | 60 j |
| `inscriptionMainDays` | Cohorte principale | 7 j |
| `inscriptionLateDays` | Sas retardataires | 3 j |
| `newWorldEverydays` | Délai entre créations de mondes | 7 j |
| `gridWidth × gridHeight` | Taille de la carte | 500 × 500 (inchangé) |
| `newbieShieldHours` | Bouclier débutant | 48 h wall-clock (ne scale pas) |

**Pourquoi pas dans `tempo`** : la durée du monde et la fenêtre d'inscription sont des **bornes**, pas des **vitesses**. Un mode « Standard 60 j à tempo lent » garde les mêmes bornes calendaires mais ralentit le rythme intérieur. Garder les deux notions séparées évite la confusion.

## 6. Garde-fous — ce que les multipliers ne touchent JAMAIS

Le tempo module la **vitesse**, pas l'**équilibre**. Les invariants suivants restent absolus quel que soit le `tempo` :

| Invariant | Spec source | Pourquoi intouchable |
|---|---|---|
| Ratios attaque / défense des unités | [`08`](./08-units.md) | Équilibrage core. Modifier ces ratios = changer le jeu, pas son tempo. |
| Coûts en pop par bâtiment / unité | [`02` § Population](./02-economy-and-progression.md#population), [`03`](./03-buildings.md), [`08`](./08-units.md) | Le trade-off armée vs infrastructure est le cœur stratégique. |
| Coûts en ressources des bâtiments / unités | [`03`](./03-buildings.md), [`08`](./08-units.md) | Modifier les coûts = casser l'équilibre 50/50 production/pillage. |
| Règle puissance ÷ 3 (garde-fou anti-snowball) | [`14` § Garde-fous](./14-pvp-conquest.md#garde-fous-anti-snowball) | Garde-fou structurel, pas une vitesse. |
| Diversité du blueprint barbare par tier | [`06` § Blueprint d'armée](./06-barbarians.md#blueprint-darmée) | Identité narrative et difficulté progressive. |
| Bonus / malus des styles de village | [`12`](./12-village-styles.md) | Choix stratégique. |
| Formules de puissance | [`09`](./09-power-and-rankings.md) | Lisibilité du classement. |
| Mobilité des unités (`speed` par unité dans [`08`](./08-units.md)) | [`08`](./08-units.md) | Ratio entre unités (cavalier > infanterie > siège). Le scaling se fait via `tempo.travelSpeed` qui multiplie l'ensemble, sans toucher aux ratios. |
| Vision Watchtower (en cases) | [`03` § Tour de guet](./03-buildings.md#tour-de-guet-watchtower) | Distance géométrique, pas une durée. |

### 6.1 Invariants **wall-clock humain** (NE scalent pas non plus)

Mécaniques exprimées en temps réel humain — elles structurent l'expérience de découverte ou de répétition d'un joueur, indépendamment du rythme de jeu.

| Invariant | Spec source | Valeur | Pourquoi NE scale PAS |
|---|---|---|---|
| Bouclier débutant | [`14` § Bouclier débutant](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde) | 48 h | « Deux soirs d'onboarding » — c'est un rythme humain, pas un temps de jeu. Un monde Speed n'a pas vocation à punir un joueur qui découvre. |
| Cooldown changement de style | [`12` § Cadre](./12-village-styles.md#cadre) | 24 h | Anti-abuse tactique (changer en boucle pour annuler un malus). C'est une cadence humaine (« une fois par jour max »), pas un timer de jeu. |
| Reset cartes quotidiennes / Oyez | [`05`](./05-daily-cards-and-oyez.md) | 04:00 Europe/Paris | Wall-clock fixe par design (rythme journalier). |
| Seuil d'abandon de compte | [`18`](./18-inactivity-and-abandonment.md) | 14 j (post-MVP, à recalibrer pour 60 j) | Mesure d'inactivité humaine. À recalibrer en jours-réels, pas en jours-tempo. |
| Reset hebdo des classements (post-MVP) | [`09` § Classements](./09-power-and-rankings.md#classements) | Lundi 00:00 UTC | Wall-clock fixe. |

🎯 **Règle d'or** : si une constante définit **« combien de temps de jeu »** ou **« combien par heure de jeu »**, elle est candidate au tempo. Si elle définit **« combien d'unités »**, **« combien de pop »**, **« quel ratio »**, **« quel seuil »**, ou **« combien de temps réel humain »**, elle est intouchable.

## 7. Impacts à recalibrer dans les autres docs

Suite au pivot 120 → 60 j et à la compression ~4-5×, les sections suivantes contiennent des chiffres absolus qui devront être **recalibrés à `tempo.global = 1.0` du Standard MVP**. Cette recalibration est volontairement **différée** — elle se fera dans une fiche de run dédiée pré-MVP, pas dans cette session de design.

### Checklist de repérage (à attaquer dans une seconde passe)

- [x] [`02-economy-and-progression.md`](./02-economy-and-progression.md)
  - ✅ Phases de progression, cible village max, validation économique et couronnes recalibrées au Standard MVP compressé.
- [x] [`03-buildings.md`](./03-buildings.md)
  - ✅ Refonte : la doc ne duplique plus aucune valeur numérique (coûts, temps, pop, capacités, productions, vision, bonus). Source de vérité unique = `packages/shared/src/village/buildings.ts`. Cf. [ADR-14](../architecture/decisions.md#adr-14--niveau-max--10-pour-tous-les-bâtiments-vs-courbe--façon-century-).
  - ✅ Courbe walled-v1 appliquée dans `BUILDING_DEFINITIONS` : early L1-L5 ultra-rapide (s → min), walls L7 / L10, tryhard full L10 ≈ 14 j wall-clock à `tempo.global = 1.0`.
- [x] [`06-barbarians.md`](./06-barbarians.md)
  - ✅ § Régénération compressé : ressources ~12 h 30 → 25 h, troupes ~25 h → 50 h selon tier.
  - ✅ Les % horaires deviennent les valeurs de base à `tempo.global = 1.0` et restent multipliés par `tempo.barbarianRegen`.
- [x] [`10-conquest.md`](./10-conquest.md)
  - ✅ § Coût de recrutement — temps d'entraînement Seigneur 8 h → 2 h.
  - ✅ Mention `gameSpeed.capture` → `tempo.captureWindow` déjà harmonisée dans cette session.
- [x] [`13-barbarian-conquest.md`](./13-barbarian-conquest.md)
  - ✅ § Période de capture — courbe 2 / 4 / 6 / 9 / 12 h → 30 min / 1 h / 1 h 30 / 2 h 15 / 3 h.
  - ✅ § Calage avec les temps existants réécrit avec les durées de Château compressées.
- [x] [`14-pvp-conquest.md`](./14-pvp-conquest.md)
  - ✅ § Période de capture variable selon le niveau du Château — courbe 4 / 6 / 9 / 12 / 18 h → 1 h / 1 h 30 / 2 h 15 / 3 h / 4 h 30.
  - ✅ Bouclier débutant 48 h confirmé **wall-clock** (cf. § 6.1), pas de scaling tempo.
- [x] [`15-onboarding.md`](./15-onboarding.md)
  - ✅ Cible « 5 étapes en ≤ 10 min » reconfirmée.
- [x] [`19-world-lifecycle.md`](./19-world-lifecycle.md)
  - ✅ Durée totale 120 → 60 j, fenêtre cohorte 14 → 7 j, retardataires 7 → 3 j déjà appliqués dans cette session. Articulation avec abandon 14 j à reprendre quand [`18`](./18-inactivity-and-abandonment.md) sortira du chantier.
- [x] [`00-game-flow.md`](./00-game-flow.md)
  - ✅ Durées et phases narratives recalibrées dans cette session (60 j, J+7, J+10, ~50 j, J+60, J+67) + ajout référence au tempo compressé.
- [x] [`07-barbarian-spawning.md`](./07-barbarian-spawning.md)
  - ✅ Densité de spawn / catchup vérifiée : pas de changement MVP, rotation couverte par la régen compressée + raréfaction progressive volontaire.

### Constantes côté code (`packages/shared/`)

À traiter dans la même fiche de run :

- `DEFAULT_CROWNS.conversionRate` (formule recalibrée `× 0.20`)
- Toutes les constantes de durée dans les configs bâtiments / unités (compressées `÷4`, arrondies au multiple de 5 s)
- `WATCHTOWER_VISION_LEVELS` (non concerné — c'est une distance, pas un temps)

## 8. Migration MVP — cadre

Cette section liste **ce qu'il faudra faire**, pas **comment**. La spec d'implémentation arrivera dans une fiche de run dédiée.

1. **Remplacer `WorldConfig.gameSpeed` et `WorldConfig.economy.productionRate` par `WorldConfig.tempo`** (global + overrides optionnels). **Clean cut, pas d'alias rétro-compat** — aucun monde n'est en prod, on ne traîne pas deux conventions inverses (l'ancienne avait « > 1 = plus rapide » + diviseurs sur durées, la nouvelle a « < 1 = plus rapide » + opérateur géré par axe). Suppression nette des champs obsolètes.
2. **Créer un `TempoService`** côté backend (ou helper dans `WorldConfigService`) qui expose une API de résolution par axe : `applyDuration(absolute, axis)` (multiplie) et `applyRate(absolute, axis)` (divise). Les use-cases ne manipulent jamais l'opérateur directement. Fallback sur `global` si pas d'override sur l'axe.
3. **Recalibrer les valeurs absolues** dans les seeds / configs partagées (`packages/shared/`) pour qu'elles correspondent au Standard MVP (`tempo.global = 1.0`). Cf. § 7.
4. **Brancher chaque axe** : remplacer les usages directs des constantes par des appels au `TempoService` dans les use-cases concernés (construction, training, expéditions, fenêtre de capture, régen barbare, production, couronnes). Localiser au passage la régen barbare (probablement dans `BarbarianRuntimeService` — non identifiée à la rédaction de cette spec, à confirmer en début de run).
5. **Adapter le frontend** pour afficher les durées effectives (déjà côté serveur — le front consomme l'effectif).
6. **Tests** : un test BFTC par axe vérifiant que `tempo.overrides` surcharge bien `global`, qu'à `global = 1.0` sans override on retombe sur les valeurs absolues post-recalibrage (snapshot du Standard MVP), et qu'à `global = 0.5` on observe bien des durées de moitié et des débits doublés.
7. **Smoke fixtures** : mettre à jour `battleforthecrown-backend/test/fixtures/smoke-world-config.ts` pour utiliser `tempo` au lieu de `gameSpeed`. Les valeurs ultra-compressées du smoke (gameSpeed 100/1000) se traduisent en `tempo` ultra-petit (~0.01).

🎯 **Lecture design** : la migration touche surtout la **plomberie** (résolution par axe via `TempoService`), pas l'archi. Aucun impact sur le pattern Outbox, le combat, le scout, les styles, l'inbox. Le clean cut est possible parce que rien n'est en prod — on ne se l'autorisera plus après le go-live.

## 9. Questions ouvertes (à trancher en playtest, pas bloquantes pour cette spec)

| Question | Position de réflexion actuelle |
|---|---|
| Valeur exacte du compressor pour le Standard MVP | Cible : `tempo ≈ 0.20-0.25` vs Tribal Wars classique (= 4-5× plus rapide). À calibrer en playtest sur la session « 60 j ressentis comme 60 j », pas comme 30 ou 120. |
| Faut-il splitter `barbarianRegen` en `barbarianRegenTroops` / `barbarianRegenResources` ? | Pas au MVP. Garder un seul axe. Si playtest montre besoin de découpler (ex : Speed avec ressources rapides mais troupes normales), on splittera post-MVP. |
| Faut-il recalibrer la durée d'abandon (14 j) ? | À vérifier en post-MVP. 14 j sur 60 j = 23 % — sans doute à descendre à 7 j sur Standard. Reste **wall-clock** dans tous les cas (cf. § 6.1). |
| UX joueur : afficher le `tempo.global` du monde dans la liste des mondes ? | Probablement oui post-MVP (« Standard », « Speed ×1.5 » comme label). Pas critique au MVP (un seul type de monde). |
| Les fenêtres `OPEN main` / `OPEN late` doivent-elles scaler avec la durée du monde ou rester en absolu ? | À trancher dans la passe de recalibration de [`19`](./19-world-lifecycle.md). Hypothèse : ratio ~15-20 % de la durée totale (déjà 7 + 3 = 10 j sur 60 j Standard MVP). |
| Bonus de classement post-MVP avec durée fixe (ex : Architectes +5 % prod pendant 7 j) | À cadrer quand [`09`](./09-power-and-rankings.md) sortira du chantier. Hypothèse : les durées de bonus sont **wall-clock** (rythme hebdomadaire, comme le reset des classements), pas tempo. |
| Les 4 multipliers économiques (`resourceProduction`, `crownsYield`, `barbarianRegen`, `unitTrainingSpeed`) doivent-ils suivre une règle de cohérence (ex : si `resourceProduction` augmente, `crownsYield` doit suivre) ? | Pas de couplage forcé au MVP. Documenter les couples « cohérents » et laisser au designer de monde. |

## 10. Rappel : ce que cette spec ne fait pas

- **Elle ne tranche pas les valeurs exactes** des temps compressés. Le design des constantes absolues reste dans `02`/`03`/`06`/`10`/`13`/`14` — cette spec définit le cadre, pas le contenu.
- **Elle ne change pas une seule mécanique de gameplay.** Pas de nouvelle unité, pas de nouveau bâtiment, pas de nouvelle règle de combat. Juste un cadre pour moduler le rythme.
- **Elle n'introduit pas de pay-to-win.** Le compressor est par-monde et fixé par le serveur, pas achetable par le joueur. Un joueur peut **choisir** un monde Speed (post-MVP) mais pas accélérer un monde existant.

## Liens

- [`19-world-lifecycle.md`](./19-world-lifecycle.md) — fenêtre temporelle du monde (durée totale, phases d'inscription).
- [`02-economy-and-progression.md`](./02-economy-and-progression.md) — formules de production / progression à recalibrer.
- [`03-buildings.md`](./03-buildings.md) — temps de construction par bâtiment (valeurs « à ×1.0 »).
- [`06-barbarians.md`](./06-barbarians.md) — régénération barbare (valeurs « à ×1.0 »).
- [`10-conquest.md`](./10-conquest.md) — Seigneur, fenêtre de capture (valeurs « à ×1.0 »).
- [`13-barbarian-conquest.md`](./13-barbarian-conquest.md) + [`14-pvp-conquest.md`](./14-pvp-conquest.md) — fenêtres de capture par tier / Château.
- [`docs/architecture/decisions.md` § ADR-12](../architecture/decisions.md) — décision d'architecture (pivot compressed-async + tempo world-scoped).

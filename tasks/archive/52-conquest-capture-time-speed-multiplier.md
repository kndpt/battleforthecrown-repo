# 52 — Multiplier de vitesse pour les durées de capture/conquête

**Sévérité** : 🟠 Moyenne  
**Statut** : ✅ Résolu 2026-05-13 par `$run @tasks/52-conquest-capture-time-speed-multiplier.md`  
**Décision gameplay** : les durées de capture/conquête doivent pouvoir être accélérées ou ralenties par la configuration du monde, comme les temps de trajet, d'entraînement et de progression économique.

## Symptôme

Les durées de capture sont actuellement fixes :

- barbares : T1 `2h`, T2 `4h`, T3 `6h`, T4 `9h`, T5 `12h` ;
- PvP : paliers Château `4h`, `6h`, `9h`, `12h`, `18h`.

Ces valeurs sont bonnes comme base de spec, mais elles ne respectent pas encore les réglages de vitesse du monde. Sur un monde accéléré, une capture reste donc en temps réel long, alors que ressources, entraînement ou trajet peuvent déjà varier.

## Objectif

Ajouter un paramètre de world config pour diviser les durées de capture.

Nom indicatif :

```ts
gameSpeed.capture
```

Sémantique recommandée :

- `capture = 1` : durée spec normale ;
- `capture = 2` : durée divisée par 2 ;
- `capture = 10` : durée divisée par 10 ;
- valeur absente : fallback `1` pour compatibilité mondes existants.

## Points à vérifier

- Source actuelle du calcul : `CombatWorker.getCaptureDurationMs(...)`.
- Les durées sont figées au moment de l'ouverture `PendingConquest.captureUntil`.
- Le worker `conquest:finalize` ne doit pas recalculer la durée.
- Les snapshots UI doivent simplement lire `captureUntil`, pas appliquer de multiplicateur frontend.

## Scope attendu

### Backend/shared

- Étendre le schéma/config partagée du monde avec `gameSpeed.capture`.
- Appliquer le diviseur uniquement au calcul de `captureUntil`.
- Garder les durées de base documentées dans `docs/gameplay/13-barbarian-conquest.md` et `14-pvp-conquest.md`.
- Définir un clamp minimum raisonnable si nécessaire pour éviter une capture instantanée accidentelle.
- Garder fallback `1` pour les mondes déjà créés.

### Tests

- Ajouter/adapter un smoke conquête :
  - config monde `gameSpeed.capture = 10` ;
  - attaque victorieuse avec Seigneur ;
  - `PendingConquest.captureUntil - openedAt` proche de `baseDuration / 10`.
- Vérifier aussi le fallback quand `gameSpeed.capture` est absent.

## Hors scope

- Changer les durées de base de la spec.
- Ajouter une UI d'admin pour modifier la vitesse du monde.
- Recalculer les captures déjà ouvertes après modification de config.
- Appliquer le multiplicateur côté frontend.

## Critères de succès

- Un monde standard garde les durées actuelles.
- Un monde accéléré réduit bien les fenêtres de capture selon `gameSpeed.capture`.
- `captureUntil` reste la source de vérité persistante.
- Les smokes conquête restent verts.
- `yarn static-check` vert.

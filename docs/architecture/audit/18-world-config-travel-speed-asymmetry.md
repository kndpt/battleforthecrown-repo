# 18 — `combat.travelSpeed` est un multiplier de vitesse rangé hors de `multipliers`

**Sévérité** : 🟠 Moyenne
**Workspace(s)** : `packages/shared`, `battleforthecrown-backend`, `battleforthecrown-pixi`
**Tags** : world-config, schema-cohesion, dx

## Symptôme

`WorldConfigSchema` regroupe trois multiplicateurs de vitesse dans `multipliers` (`construction`, `production`, `training`) mais le quatrième — la vitesse de voyage des armées — vit ailleurs, sous `combat.travelSpeed`. Sémantiquement c'est un multiplier au même titre que les autres : il divise un temps. Mais il est rangé avec les paramètres de balance combat (`attackBonus`, `defenseBonus`, `lootFactor`) qui, eux, ne sont pas des accélérateurs.

## Localisation

`packages/shared/src/world/schemas.ts` — `WorldConfigSchema` :

```ts
{
  multipliers: { construction, production, training }, // 3 axes vitesse
  combat: { travelSpeed, attackBonus, defenseBonus, lootFactor }, // 1 axe vitesse + 3 axes balance
  ...
}
```

Consommateurs :

- `battleforthecrown-backend/src/modules/world/world-config.service.ts:131,159` — `config.combat.travelSpeed` dans `getTravelTime` / `getTravelTimeForArmy`.
- `battleforthecrown-pixi/src/features/combat/AttackDetailModal.tsx:59` — `worldConfig.data?.combat.travelSpeed` dans le calcul d'ETA front.

## Détail technique

Formule appliquée dans les deux directions :

```
timeMinutes = distance × unitSpeed ÷ travelSpeed
```

C'est exactement la sémantique d'un multiplicateur de vitesse, identique à `time / multipliers.training` pour l'entraînement. La seule différence est l'emplacement dans la config.

## Impact

- **Confusion utilisateur côté dev** : un opérateur qui veut accélérer "tout × 100" pour un monde de test pose `multipliers.{construction,production,training} = 100` et constate que les attaques restent lentes. Cas réel observé le 2026-05-06 — il a fallu expliquer que `combat.travelSpeed` est un quatrième axe à régler séparément.
- **Lecture du schéma** : un nouveau lecteur de `WorldConfigSchema` voit `multipliers: { construction, production, training }` et conclut "tous les accélérateurs sont là". Faux.
- **Cohérence avec [ticket 04](./04-world-config-permissive-typing.md)** : la résolution de 04 a figé cette asymétrie dans le schéma Zod strict — la dette est désormais documentée par le code.

## Contexte

Hérité de `DEFAULT_COMBAT_RULES` côté shared (`packages/shared/src/combat/index.ts`), où `travelSpeed` cohabite historiquement avec les bonus offensifs/défensifs et le facteur de loot. La résolution du ticket 04 a conservé cette structure pour rester chirurgical (pas de migration de schéma supplémentaire dans le même PR).

## Pistes à explorer

- **Déplacer** `combat.travelSpeed` → `multipliers.travel` (ou `multipliers.armySpeed`). Tous les multiplicateurs de vitesse au même endroit.
  - Migration Prisma `UPDATE world SET config = jsonb_set(jsonb_set(config, '{multipliers,travel}', config->'combat'->'travelSpeed'), '{combat}', (config->'combat') - 'travelSpeed')`.
  - Update `WorldConfigSchema`, `getTravelTime`/`getTravelTimeForArmy`, `AttackDetailModal`, `DEFAULT_COMBAT_RULES`, seed.
- **Garder tel quel + documenter**. Ajouter un commentaire dans `WorldConfigSchema` qui explicite que `combat.travelSpeed` est aussi un multiplier.
- **Renommer pour clarifier l'intention** : `combat.travelSpeedMultiplier` au lieu de `combat.travelSpeed`. Ne résout pas l'emplacement mais rend la sémantique évidente.

## Tickets liés

- [04 — Typage permissif `WorldConfigDto`](./04-world-config-permissive-typing.md) ✅ — la résolution a figé la structure actuelle.
- [16 — Magic numbers hardcodés](./16-magic-numbers-hardcoded.md) — même famille (config monde / configurabilité).

## Dimensions à valider en sortie

- Un opérateur qui pose `multipliers.* = N` voit *tous* les axes de vitesse accélérés du même facteur — ou la doc/schéma rend explicite que `travelSpeed` est un axe séparé.
- Le schéma Zod `WorldConfigSchema` est lisible : un nouveau lecteur comprend immédiatement où sont les multiplicateurs de vitesse.

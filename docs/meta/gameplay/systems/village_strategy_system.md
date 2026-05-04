---
tags: [ai-doc, rag, gameplay, village-strategy]
version: 1.0
last_updated: 2025-11-08
---

# Village Strategy System

## Overview

Every village chooses one of four **strategic styles** from the Council Hall.  
This choice bundles a cohesive set of buffs and penalties that affect production, combat, storage, training, and population capacity.  
The system keeps villages distinct (Defensive, Raider, Economic, Balanced) while tying the change to crowns, cooldowns, and deliberate player intent.

## Definitions

- **Village Strategy**: The active style (`FORTRESS`, `RAIDERS`, `ECONOMIC`, `BALANCED`) tracked on the village and persisted in `VillageStrategyConfig`.
- **Strategy Config**: The world-level definition that declares bonuses, cooldown duration, base cost, and recommendation metadata.
- **Strategy Bonus Config**: Multipliers and modifiers exposed to services (`Resources`, `Population`, `Army`, `Combat`, `WorldConfig`) when computing outcomes.
- **Crowns**: Currency used to change strategy; drawn from `CrownBalance` and capped per world rules.
- **Council Hall**: Building that exposes the switch UI and enforces the 24h cooldown / crown cost mechanics.
- **Outbox Event**: `village.strategy.changed` emitted so downstream services (notifications, analytics) stay in sync.

## Core Description

| Strategy     | Bonuses applied by backend                             | Penalties                      | Behavioral Hooks |
| ------------ | ----------------------------------------------------- | ------------------------------ | ---------------- |
| **FORTRESS** | +25% unit defense, +10% storage capacity, −20% army speed | Lower army mobility             | Recommended when walls/watchtower/max stock |
| **RAIDERS**  | +15% army speed, +10% loot factor, −10% defense, −20% unit costs while training | Slightly gouged defenses | Focuses on barracks, cavalry, raids |
| **ÉCONOMIQUE** | +20% resource production, +10% population cap, −10% attack, −10% defense | Less combat resilience       | Farms, mines, warehouses |
| **ÉQUILIBRÉ** | No bonuses/malus (all multipliers reset to 1.0)         | —                              | Balanced builds |

### Mechanics

- **Cooldown / Cost**: Changes cost crowns (first change free, repeating changes within 24h +50% cost capped at 500) and trigger a 24h cooldown stored on `VillageStrategyConfig`.
- **Application**: Services compute strategy effects by calling `VillageStrategyService.getStrategyBonus(context)`; contexts include `combat`, `production`, `training`, `storage`, `population`, `construction`.
- **Storage**: Warehouse caps and catch-up calculations (ResourcesService) use `storageBonus` when present, so resource gains and `maxPerType` scale with the active strategy.
- **Population**: `PopulationService` multiplies village max population with `populationBonus`, affecting available workforce and housing.
- **Training**: `ArmyService` pulls both `trainingSpeedBonus` and `unitCostReduction` from the strategy context; time per unit respects global world multipliers plus these strategic modifiers, while resource costs are throttled when a strategy defines a reduction.
- **Combat**: Combat workers layer `attackBonus`, `defenseBonus`, `lootBonus`, and `armySpeedBonus` into the travel time and combat formulas so offensive/defensive styles behave as described.
- **Construction**: `WorldConfigService.getCost` consumes `buildingCostReduction` and `constructionSpeedBonus`, meaning architecture costs/times can shift per strategy.
- **Eventing**: Every change writes to the event outbox (`village.strategy.changed`) to power UI updates and notifications.

## Relationships

- **Buildings System**: Strategy choices are exposed through the Council Hall building and influence building-related values (storage limit tends to depend on warehouses).
- **Population System**: Population capacity multipliers increase or decrease house/worker availability according to strategy.
- **Resources System**: Production rates and storage limits incorporate strategy multipliers, keeping the economy loop aligned with the chosen style.
- **Army System**: Training queues gain speed/cost modifiers; combat workers use strategy bonuses for travel time, attack, defense, and loot calculations.
- **Power System**: Strategy choices can be part of the player’s scoring profile; the outbox event integrates with scoring/notification pipelines.

## Constraints

- Strategy changes are guarded by crown balance checks and cooldown enforcement (`ConflictException` when cooldown active).
- Only four named strategies are valid (`FORTRESS`, `RAIDERS`, `ECONOMIC`, `BALANCED`); any world can override their bonus set, but services expect these keys.
- Storage and training bonuses only apply when a `village.strategyConfig` exists; default behavior is neutral to avoid regressions.
- Every service using strategy bonuses should call `VillageStrategyService` with the correct context to keep calculations consistent.

## References

- [Gameplay Foundations – Village Strategy](../mechanics/GAMEPLAY_FOUNDATIONS_DESIGN.md#%EF%B8%8F-5-styles-stratégiques-de-village)
- [Village Strategy Backend](../../battleforthecrown-backend/docs-v2/technical/systems/VILLAGE_STRATEGY.md)
- [Buildings System](./buildings_system.md)
- [Resources Service](../../battleforthecrown-backend/src/modules/resources/resources.service.ts)
- [Army and Combat Services](../../battleforthecrown-backend/src/modules/army/army.service.ts)

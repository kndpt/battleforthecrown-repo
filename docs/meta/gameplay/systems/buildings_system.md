---
tags: [ai-doc, rag, gameplay, buildings-system]
version: 1.0
last_updated: 2025-11-04
---

# Buildings System

## Overview

This document defines the building system for villages.  
Buildings are the core structures of each village, enabling resource production, defense, and progression.  
Every building has a passive effect, an upgradeable level, and may unlock new game functionalities.

## Definitions

- **Building**: A constructible structure inside a village that provides passive bonuses and unlocks game mechanics.
- **Building Level**: The current upgrade tier of a building that determines its efficiency.
- **Passive Effect**: An automatic, continuous effect granted by a building (e.g., increased resource production).
- **Upgrade Queue**: The list of ongoing building upgrades limited by the castle level.
- **Construction Cost**: Resources and population consumed to upgrade a building.
- **Construction Time**: Duration required to complete a building upgrade.
- **Castle**: The central building controlling global upgrade speed, queue capacity, and access to advanced structures.

## Core Description

Each village contains a set of unique buildings.  
Buildings define the village’s purpose — economic, defensive, or military.  
Each building can be upgraded, increasing its passive bonuses and unlocking additional mechanics.

| Building         | Role                      | Passive Effect                                              |
| ---------------- | ------------------------- | ----------------------------------------------------------- |
| **Castle**       | Central hub               | +construction speed, +queue capacity, unlocks new buildings |
| **Wood Camp**    | Produces Wood             | +wood production                                            |
| **Stone Quarry** | Produces Stone            | +stone production                                           |
| **Iron Mine**    | Produces Iron             | +iron production                                            |
| **Warehouse**    | Storage                   | +maximum resource capacity                                  |
| **Farm**         | Population                | +population capacity                                        |
| **Barracks**     | Unit training             | +training speed, unlocks unit tiers                         |
| **Watchtower**   | Vision                    | +map visibility radius                                      |
| **Wall**         | Defense                   | +global village defense                                     |
| **Hideout**      | Resource protection       | Hide part of resources from loot                            |
| **Council Hall** | Strategic style selection | Enables village strategy choice                             |
| **Throne Room**  | Lord recruitment          | Enables noble recruitment and conquest                      |

### Upgrade Mechanics

- **Queue Capacity**: 2 concurrent upgrades by default; increased by Castle level.
- **Population Cost**: Each construction consumes population permanently.
- **Cancellation**: Fully refunds resources and population.
- **Scaling**: Construction time and cost increase exponentially per level.
- **Passive Bonus**: Each level increases efficiency according to its category.

### Example Formulae

```
Construction_Time = Base_Time × (Multiplier ^ (Level - 1))
Construction_Cost = Base_Cost × (Multiplier ^ (Level - 1))
```

**Castle Example**: +5% construction speed per level, max -40% at level 10.

### Upgrade Progression

| Level Range | Progression Type    | Description                            |
| ----------- | ------------------- | -------------------------------------- |
| 1–5         | Rapid discovery     | Linear increase, immediate feedback    |
| 6–10        | Investment phase    | Exponential cost increase              |
| >10         | Prestige (post-MVP) | Diminishing returns, symbolic upgrades |

## Relationships

- Depends on **Population System** for available workforce.
- Affects **Economy System** by modifying production rates and storage.
- Interacts with **Power System** for scoring and ranking.
- Unlocks content in **Units & Combat System** (Barracks, Throne Room).
- Linked to **Economy and Progression** for cost and time scaling.

## Constraints

- Each building has a fixed maximum level.
- Population and resources must be available before upgrade starts.
- Construction actions respect queue limits and dependencies.
- Upgrades cannot be paused or interrupted except via cancellation.
- Some buildings are locked until the Castle reaches required levels.

## References

- villages_and_resources.md
- population_system.md
- units_and_combat.md
- power_system.md
- economy_and_progression.md

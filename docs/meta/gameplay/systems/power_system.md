---
tags: [ai-doc, rag, gameplay, power-system]
version: 1.0
last_updated: 2025-11-04
---

# Power System

## Overview

This document defines the **Power System**, which measures the overall strength of villages and kingdoms.  
Power serves as a key metric for leaderboards, strategic evaluation, and balancing between players.  
It is derived from the cumulative strength of buildings and military units.

## Definitions

- **Village Power**: The total strength value of a single village based on its buildings and army.
- **Building Power**: The sum of weighted building levels in a village.
- **Army Power**: The total combat value of all units in a village.
- **Kingdom Power**: The total combined power of all villages owned by a player.
- **Spy Action**: A reconnaissance action that reveals hidden military power.
- **Weight Coefficient**: A numerical multiplier applied to each building or unit type to calculate its contribution to total power.

## Core Description

### Power Calculation

Power is computed separately for buildings and armies, then aggregated:

```
Village_Power = Building_Power + Army_Power
Kingdom_Power = Σ(Village_Power)
```

#### Building Power

```
Building_Power = Σ(Building_Level × Weight_Building)
```

#### Army Power

```
Army_Power = Σ(Unit_Quantity × Unit_Weight)
```

Each building and unit type has an assigned weight multiplier reflecting its strategic importance and resource investment.  
For example, a Castle or Wall provides higher power values than basic mines.

### Visibility Rules

- **Building Power** is public and visible to all players.
- **Army Power** is hidden unless revealed by successful **Spy** missions.
- **Kingdom Power** is public and displayed in rankings.

### Strategic Uses

- Power determines **leaderboard ranking** for players and alliances.
- It helps players evaluate the difficulty of attacking other villages.
- It influences **Crown income**, linking strategic and economic systems.

### Example

| Type               | Formula                              | Example                 |
| ------------------ | ------------------------------------ | ----------------------- |
| **Building Power** | 40 × Castle Level + Σ(other weights) | 40 × 10 = 400           |
| **Army Power**     | Σ(Unit_Quantity × Unit_Weight)       | 200 Squires × 8 = 1600  |
| **Village Power**  | Building + Army                      | 400 + 1600 = 2000       |
| **Kingdom Power**  | Σ(Villages)                          | 5 × 2000 = 10,000 total |

## Relationships

- Relies on **Buildings System** for structure levels and weights.
- Relies on **Units and Combat System** for army data.
- Used by **Economy and Progression System** to adjust rewards (Crowns).
- Tied to **Villages and Resources System** for Crown generation per hour.
- Interacts with **Events and Rankings System** to determine leaderboard positions.

## Constraints

- Only completed buildings and alive units contribute to total power.
- Hidden armies remain secret unless revealed by spy actions.
- Destroyed or captured villages are immediately removed from the owner’s total power.
- Weight coefficients must remain constant across all players to maintain fairness.

## References

- buildings_system.md
- units_and_combat.md
- economy_and_progression.md
- villages_and_resources.md
- events_and_daily_systems.md

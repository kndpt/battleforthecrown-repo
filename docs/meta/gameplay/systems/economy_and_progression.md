---
tags: [ai-doc, rag, gameplay, economy, progression-system]
version: 1.0
last_updated: 2025-11-04
---

# Economy and Progression System

## Overview

The **Economy and Progression System** defines how players generate, spend, and balance resources to develop their villages and kingdoms.  
It governs the pace of growth, cost scaling, and the overall equilibrium between passive production and active looting.  
Its goal is to ensure steady progression over roughly one month for a full village, maintaining fair balance between active and passive players.

## Definitions

- **Resources**: Core materials required for construction, training, and upgrades — Wood, Stone, Iron.
- **Production Buildings**: Structures that generate resources passively (Wood Camp, Quarry, Iron Mine).
- **Storage**: Resource capacity limits determined by Warehouse level.
- **Crown Currency**: Strategic currency used for high-level actions (strategy changes, seigneur creation, bonuses).
- **Upgrade Cost**: Resource and time cost required to level up a building.
- **Progression Phases**: Distinct stages (Early, Mid, Late game) defining pacing and player objectives.
- **Power Weight**: Value assigned to buildings for power computation (see Power System).

## Core Description

### Economic Loop

Players continuously balance **production**, **spending**, and **population management**.  
The economy loop ties together multiple subsystems:

1. **Passive Production** — Buildings generate resources over time based on their level:

   ```
   Production(level_n) = 50 × (1.4 ^ (n-1))
   ```

   Higher levels exponentially increase hourly income.

2. **Active Gain (Raiding)** — Players double their income potential by attacking barbarian or player villages.  
   Active players can progress roughly twice as fast.

3. **Spending Resources** — All actions (construction, training, upgrades) consume resources, forcing trade-offs.

4. **Crown Economy** — Crowns connect gameplay loops: used for strategy switches, naming seigneurs, and temporary bonuses.

### Progression Phases

The game follows three main progression stages with specific pacing:

| Phase          | Description             | Construction Duration | Production (avg) | Gameplay Focus             |
| -------------- | ----------------------- | --------------------- | ---------------- | -------------------------- |
| **Early Game** | Discovery & Hook        | 10–60 min             | ~200/h           | Fast building, early raids |
| **Mid Game**   | Strategic Development   | 2–6 h                 | ~800/h           | Balanced economy & raids   |
| **Late Game**  | Optimization & Conquest | 8–24 h                | ~2,000/h         | Multi-village strategy     |

Total progression target: ~30 days (≈100 hours of play).

### Building Costs and Scaling

Each building type uses exponential scaling to ensure long-term balance.

| Category            | Base Cost Formula     | Multiplier |
| ------------------- | --------------------- | ---------- |
| **Castle**          | 250 × (1.17 ^ (n−1))  | 1.17       |
| **Production**      | 150 × (1.20 ^ (n−1))  | 1.20       |
| **Military**        | 400 × (1.18 ^ (n−1))  | 1.18       |
| **Storage**         | 150 × (1.15 ^ (n−1))  | 1.15       |
| **Defensive**       | 2000 × (1.25 ^ (n−1)) | 1.25       |
| **Spy / Strategic** | 300 × (1.30 ^ (n−1))  | 1.30       |

Time cost uses similar multipliers:

```
Time(level_n) = Base_Time × (Multiplier ^ (n-1)) × Castle_Bonus
```

### Production vs. Pillage Balance

The economic design aims for a **50/50 ratio** between passive and active income.

| Source                    | Average Share | Description               |
| ------------------------- | ------------- | ------------------------- |
| **Passive Production**    | 50%           | Steady hourly gain        |
| **Active Loot (Raiding)** | 50%           | Encourages daily activity |

An active raider can progress approximately twice as fast as a passive player.

### Example — Daily Economy

| Source        | Approx. Income/day | Contribution |
| ------------- | ------------------ | ------------ |
| Passive Mines | 54,000             | 50%          |
| Raiding       | 54,000             | 50%          |
| Daily Quest   | 5,000–10,000       | +10–15%      |

## Relationships

- Depends on **Buildings System** for production, scaling, and upgrade logic.
- Interacts with **Population System** for resource allocation trade-offs.
- Provides inputs to **Power System** (building weights).
- Tied to **Events and Daily Systems** (bonuses, multipliers).
- Balanced by **Quests and Retention System** (economic rewards).

## Constraints

- Production cannot exceed storage capacity.
- Upgrade costs and time scale exponentially but remain bounded for fair pacing.
- Crown earnings are capped by performance tiers to prevent inflation.
- Resource types (Wood, Stone, Iron) maintain equal importance across all stages.

## References

- villages_and_resources.md
- buildings_system.md
- population_system.md
- power_system.md
- events_and_daily_systems.md
- quests_and_retention.md

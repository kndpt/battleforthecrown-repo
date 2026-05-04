---
tags: [ai-doc, rag, gameplay, quests, retention]
version: 1.0
last_updated: 2025-11-04
---

# Quests and Retention System

## Overview

The **Quests and Retention System** provides short-term objectives and periodic rewards to encourage consistent player engagement.  
It complements the Events and Daily Systems by offering predictable daily incentives, designed to be achievable in short play sessions while maintaining long-term motivation.

The system’s purpose is to create **habit-forming gameplay** without introducing grind or imbalance.

## Definitions

- **Daily Quest**: A single, time-limited objective that resets every 24 hours.
- **Weekly Quest (VIP)**: A high-value task available once per week.
- **Progression Tier**: A scaling system that adjusts quest difficulty and rewards to the player’s castle level.
- **Reward Pool**: The resource and currency bundle granted upon quest completion.
- **Reset Cycle**: The global server reset time (04:00) when new quests are assigned.
- **Retention Metric**: The system goal of maintaining daily and weekly player return rates.

## Core Description

### Daily Quests

Each day, every player receives **one unique quest** randomly drawn from a tier-appropriate pool.  
Quests are designed to be completed in **10–20 minutes** and reward the equivalent of **4–10 hours of passive production**.

| Quest Tier   | Castle Levels | Reward Value            | Example Objectives                                   |
| ------------ | ------------- | ----------------------- | ---------------------------------------------------- |
| **Tier 1**   | 1–4           | 2,000–3,000 resources   | Build or upgrade 2 buildings, repel 1 barbarian raid |
| **Tier 2**   | 5–7           | 4,000–6,000 resources   | Raid 5 villages, train 40 population of units        |
| **Tier 3**   | 8–10          | 7,000–10,000 resources  | Conquer 1 village, upgrade 3 buildings               |
| **Tier VIP** | All           | 12,000–15,000 resources | Weekly high-value quest (e.g. win 15 battles)        |

Each quest’s progress is tracked persistently until reset, ensuring fairness even if players log off mid-progression.

### Weekly VIP Quest

Once per week, a special quest becomes available offering significantly higher rewards.  
It targets long-term retention and player loyalty by rewarding consistent engagement.

**Example:**

> “Win 15 battles (offense or defense)” → Reward: 5,000 of each resource + 1,000 Crowns

### Reward Structure

Rewards include a mix of base resources and strategic currency:

- **Wood, Stone, Iron** (production equivalents)
- **Crowns** (strategic currency)
- **Temporary buffs** or **cosmetic prestige** (optional post-MVP)

### Integration with Player Progression

Daily quests scale automatically:

- Difficulty and target values adjust to player progression.
- The system references **Castle Level** to define tiers.
- Each quest dynamically aligns with the player’s development phase (economic, military, conquest).

### Retention Mechanics

The system uses consistent, low-friction patterns:

- Predictable reset time (04:00) encourages morning or evening logins.
- Short sessions (5–20 minutes) maximize engagement value.
- Rewards are meaningful but not mandatory for progression, preventing burnout.

## Relationships

- Depends on **Economy and Progression System** for production value benchmarks.
- Connects with **Events and Daily Systems** for synchronized reset cycles and combined incentives.
- Informs **Power System** via indirect performance boosts from quest rewards.
- Relies on **Villages and Resources System** for contextual objectives.

## Constraints

- Only one active quest at a time.
- Daily quests reset automatically after 24 hours.
- Weekly quests reset every 7 days.
- Uncompleted quests expire at reset time.
- Rewards must align with economic equilibrium (≈10–15% daily progression contribution).

## References

- events_and_daily_systems.md
- economy_and_progression.md
- power_system.md
- villages_and_resources.md
- population_system.md

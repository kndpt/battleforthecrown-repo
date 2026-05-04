---
tags: [ai-doc, rag, gameplay, events, daily-systems]
version: 1.0
last_updated: 2025-11-04
---

# Events and Daily Systems

## Overview

The **Events and Daily Systems** create dynamic engagement loops that encourage regular player interaction.  
They introduce temporary global bonuses, individual daily choices, and limited-time objectives to maintain retention without disrupting core balance.

These systems combine server-wide events (“Oyez”) and personal temporary effects (daily blessings), shaping a living world with cyclical incentives.

## Definitions

- **Oyez Event**: A global server-wide event that applies themed bonuses for a limited duration (1–7 days).
- **Daily Blessing**: A personal, temporary buff that lasts 4 hours and refreshes every 24 hours.
- **Cooldown**: The time before a new event or blessing becomes available again.
- **Category Conflict**: When multiple bonuses of the same type exist, only the strongest applies.
- **Retention Loop**: Design pattern ensuring players return regularly through light incentives.

## Core Description

### Oyez (Global Events)

**Oyez** are announced by the royal herald and affect all players simultaneously.  
They aim to temporarily alter the meta with minor but meaningful boosts — never unfair advantages.

| Example Oyez            | Effect                 | Duration |
| ----------------------- | ---------------------- | -------- |
| “Week of Iron”          | +25% Iron production   | 7 days   |
| “Moon of War”           | +15% training speed    | 2 days   |
| “Day of Builders”       | −10% construction time | 24h      |
| “Royal Blessing”        | +Gain in Crowns        | 5 days   |
| “Eye of the Watchtower” | +2 vision range        | 24h      |

**Rules:**

- One Oyez active globally at a time.
- Starts automatically at fixed intervals (1–2 per week).
- Not stackable with Daily Blessings of the same category (highest value applies).
- Displayed in UI as a parchment with heraldic animation and short description.

### Daily Blessings

Each player receives **three random blessings** every 24 hours and must **choose one**.  
The selected blessing lasts for **4 hours real time**, encouraging frequent logins.

| Blessing       | Effect                   | Rarity |
| -------------- | ------------------------ | ------ |
| Mason          | −10% construction time   | Common |
| Marshal        | −10% training time       | Common |
| Raider         | +20% loot on barbarians  | Common |
| Architect      | +1 building slot         | Epic   |
| Master-at-Arms | +1 training slot         | Epic   |
| Farmer         | +5% available population | Epic   |

**Rules:**

- Refresh time: 04:00 (server time).
- Duration: 4 hours.
- Rarity tiers: Common 70%, Rare 25%, Epic 5%.
- Category conflicts resolved by using highest active value.
- Non-stackable with Oyez bonuses of the same category.

### Retention Mechanics

Daily systems are intentionally lightweight:

- **Decision loops**: 1 choice per day keeps user engagement predictable and low-friction.
- **Small but visible gains**: Reinforces sense of progress.
- **Reset cycles**: Align with global Oyez and daily reset (04:00) for synchronization.
- **Server economy neutrality**: Effects boost activity, not long-term imbalance.

## Relationships

- Linked to **Economy and Progression System** through temporary multipliers.
- Interacts with **Power System** indirectly via enhanced production or training.
- Reinforces **Quests and Retention System** by incentivizing daily play.
- Uses **Villages and Resources System** data for production and timing synchronization.

## Constraints

- Only one Oyez active per server.
- Blessings limited to one at a time per player.
- Effects of identical category do not stack; strongest applies.
- All durations and resets synchronized with global server clock (04:00).
- Rewards balanced to avoid permanent advantage or inflation.

## References

- economy_and_progression.md
- power_system.md
- quests_and_retention.md
- villages_and_resources.md
- population_system.md

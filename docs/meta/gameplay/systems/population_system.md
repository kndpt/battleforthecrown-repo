---
tags: [ai-doc, rag, gameplay, population-system]
version: 1.0
last_updated: 2025-11-04
---

# Population System

## Overview

This document defines the **Population System** used in villages.  
Population represents the available citizens who can be assigned to construction and unit training.  
It introduces a core trade-off between economic development and military power.

## Definitions

- **Population**: A finite resource that determines how many buildings and units a village can sustain.
- **Maximum Population**: The total number of inhabitants allowed in a village, determined by the Farm building level.
- **Allocated Population**: Population consumed by existing buildings and active military units.
- **Available Population**: Population that remains unused and can be spent on new actions.
- **Population Cost**: The amount of population consumed by constructing or training an entity.
- **Farm**: The building responsible for increasing the maximum population of a village.

## Core Description

Each village has a **fixed and finite** amount of population determined by the **Farm level**.  
Population acts as a global constraint on growth — every building and unit consumes a portion of the total.

Population allocation works as follows:

- **Constructing a building** permanently consumes population until the building is destroyed.
- **Training a unit** consumes population until that unit dies.
- **Destroying a building** or **losing units** frees population, making it available again.

### Population Formula

```
Population_Available = Population_Max
                     - Σ(Population_Buildings)
                     - Σ(Population_Units)
```

### Example

A village with:

- Farm Level 3 → 200 maximum population
- Buildings consume 80 population
- Units consume 70 population

Available population = 200 - (80 + 70) = **50**

The player can use 50 additional population for new constructions or units.

### Strategic Trade-offs

Population management forces meaningful decisions:

- **Economic focus**: Invest in production buildings → fewer troops available.
- **Military focus**: Train large armies → slower infrastructure growth.
- **Balanced approach**: Combine moderate construction and army size.

Losses in battle or destruction of buildings free population, allowing faster recovery and reallocation of strategy.

## Relationships

- **Farm (Building System)** increases the population capacity.
- **Buildings System** consumes population for construction.
- **Units and Combat System** consumes and releases population dynamically.
- **Economy and Progression System** balances population availability with production scaling.

## Constraints

- Each village has its own population cap; population is not shared globally.
- No entity can be built or trained without sufficient available population.
- Population cost is permanent until the consuming entity is destroyed or killed.
- Population values must always remain within defined system limits.

## References

- buildings_system.md
- units_and_combat.md
- economy_and_progression.md
- villages_and_resources.md

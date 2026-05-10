# Architecture

- Agents Codex configurés dans `.codex/agents/*.toml`; chaque fichier définit `name`, `description`, `model`, `model_reasoning_effort`, `sandbox_mode` et `developer_instructions`.
- Village frontend : les états verrouillé/non construit/en chantier/max passent par `getBuildingLockState`; `VillageScene` filtre les états non construits au lieu de rendre des placeholders level 0.

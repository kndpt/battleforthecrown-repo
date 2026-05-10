# Revue modèles agents Codex

## Plan

- [x] Lire les TOML existants dans `.codex/agents/`.
- [x] Définir une matrice de modèles adaptée aux rôles avec `gpt-5.5`.
- [x] Mettre à jour les champs `model` / `model_reasoning_effort` nécessaires.
- [x] Vérifier le diff et la validité TOML.
- [x] Documenter le résultat de review.

## Décision modèle

- `code_mapper` : garder `gpt-5.4-mini`, lecture seule, cartographie compacte et rapide.
- `test_runner` : garder `gpt-5.4-mini`, exécution/parsing de tests à faible besoin de raisonnement.
- `run_planner` : passer à `gpt-5.5`, rôle de synthèse et arbitrage élevé.
- `doc_writer` : passer à `gpt-5.4`, cohérence documentaire bornée, pas besoin systématique de `5.5`.
- `implementer` : passer à `gpt-5.5`, agent de modification code avec jugement senior.
- `test_writer` : passer à `gpt-5.5`, choix de tests et refus d'anti-patterns plus sensibles.

## Review

- Matrice finale vérifiée par `rtk grep "model =" .codex/agents`.
- Efforts finaux vérifiés par `rtk grep "model_reasoning_effort" .codex/agents`.
- Parse TOML formel non exécuté : Python local est en 3.9 sans `tomllib`, `tomli` absent, et aucun `taplo`/`yq`/`tomlq` disponible.
- Risque syntaxique évalué faible : seules des valeurs de chaînes TOML existantes ont été remplacées, sans toucher aux blocs multi-lignes.

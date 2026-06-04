# Discoveries

- 2026-06-03: `capture-duration.ts` doit rester aligné sur les specs compressées : barbares doc 13/23 = 30min/1h/1h30/2h15/3h, PvP doc 14 = 1h->4h30.
- 2026-06-03: Le smoke `combat-conquest-hook` ne doit pas dupliquer `T1_CAPTURE_DURATION_MS`; importer `BARBARIAN_CAPTURE_DURATIONS_MS.T1` évite de retomber sur l'ancienne courbe 2h.
- 2026-06-03: Capture PvP locale 18h venait de `PVP_CAPTURE_DURATIONS_MS` désaligné doc 14 (Château 10 => 18h code vs 4h30 spec); si une fenêtre est déjà ouverte, aussi rescheduler `pending_conquest.capture_until` et `pgboss.job.start_after`.
- 2026-06-03: Vue Armée Pixi : ne pas construire les sections d'inventaire depuis `BARRACKS_UNIT_TYPES`; `NOBLE` vient de l'inventaire complet mais reste hors `barracksTroops`/drag Caserne.
- 2026-05-10: Environnement local Python 3.9 sans `tomllib`/`tomli`; pas de `taplo`, `yq` ou `tomlq` disponibles pour valider formellement les TOML.
- 2026-05-10: Le build Pixi était cassé par configs d'unités frontend non exhaustives après ajout shared de `WARRIOR` et `RAM`; corrigé dans `features/army/unitConfig.ts` et `src/lib/unitConfig.ts`.

---
name: bftc-diagnose
description: Use when debugging a BFTC bug/perf regression needs a repro loop before fix or before `$bftc-run`.
---

# BFTC Diagnose

But : prouver un bug avant fix, puis router vers fix direct, `$bftc-plan` ou `$bftc-run`.

## Protocol

1. Lire `tasks/lessons.md`, rules utiles, briefing workspace.
2. Construire le plus petit signal rouge agent-runnable : test ciblé, curl, smoke, SQL via `bftc-db`, replay Outbox/WS, ou harness jetable.
3. Minimiser le cas tout en gardant la repro originale pour la fin.
4. Lister 3-5 hypothèses falsifiables : `Si Hn est vraie, <probe> montre <résultat>`.
5. Tester une variable à la fois. Logs temporaires seulement avec préfixe `[DEBUG-<slug>]`.
6. Conclure avec :

```markdown
Signal rouge: `<commande>` → <résultat>
Cas minimisé: <résumé>
Cause racine: <prouvée ou non prouvée>
Regression seam: <test/smoke/curl/SQL ou absence de seam>
Route: fix direct | `$bftc-plan ...` | `$bftc-run @...`
```

## Gates

- Pas de fix durable sans signal rouge, sauf dérogation user explicite.
- Nettoyer tout `[DEBUG-...]` : `rtk grep "\[DEBUG-" .`.
- Si aucun seam de régression n'existe, le noter comme dette d'architecture concrète.

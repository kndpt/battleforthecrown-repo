# Ticket 68 - send back foreign reinforcement

- [x] Preflight: git clean, ticket, source combat, rules, SPEC, backend briefing, tests/outbox skills lus.
- [x] Cartographier `initiateRecall`, outbox `reinforcement.recalled`, et le smoke renfort existant.
- [x] Implémenter l'autorisation host-or-origin sans changer l'API.
- [x] Ajouter le smoke `send-back foreign reinforcement`.
- [x] Vérifier smokes backend obligatoires puis `yarn static-check`.
- [x] Review 5 axes, docs impact, archive ticket, README, commit.

## Notes

- Scope strict backend: aucun changement frontend attendu.
- SPEC applicable: §C server-authoritative, Outbox transactionnel, pas de migration destructive.
- Critère central: user possède soit l'hôte (`villageId`), soit l'origine (`originVillageId`).

## Review

- Correctness: l'auth accepte désormais origin-owned ou host-owned; le smoke couvre le renvoi étranger host-owned, le recall existant reste vert.
- Readability: changement localisé dans `initiateRecall`, API inchangée.
- Architecture: mutation toujours server-authoritative; Outbox existante conservée dans la transaction.
- Security: un user ne possédant ni hôte ni origine reçoit 403, couvert par smoke.
- Performance: deux lectures village parallélisées dans la transaction; impact négligeable.
- Review indépendante: GO, aucun finding bloquant/majeur/mineur.

## Verification

- `yarn workspace battleforthecrown-backend test:smoke:run reinforcements.smoke.spec.ts --runInBand` OK (2 tests).
- `yarn test:smoke:preflight` OK.
- `yarn workspace battleforthecrown-backend test:smoke` OK (23 suites, 45 tests).
- `yarn static-check` OK.

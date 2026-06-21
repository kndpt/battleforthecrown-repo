-- Garde-fous d'intégrité : la Renommée (XP cumulée + crédits ledger) ne peut
-- jamais être négative, même en cas de régression applicative.
-- (revue CodeRabbit PR #176)
ALTER TABLE "user"
  ADD CONSTRAINT "user_renown_xp_non_negative_chk" CHECK ("renown_xp" >= 0);

ALTER TABLE "renown_ledger"
  ADD CONSTRAINT "renown_ledger_xp_non_negative_chk" CHECK ("xp" >= 0);

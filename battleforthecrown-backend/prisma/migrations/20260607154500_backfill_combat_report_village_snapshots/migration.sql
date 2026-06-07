UPDATE "combat_report" AS cr
SET
  "attacker_village_name" = v."name",
  "attacker_x" = v."x",
  "attacker_y" = v."y"
FROM "village" AS v
WHERE v."id" = cr."attacker_village_id"
  AND (
    cr."attacker_village_name" IS NULL
    OR cr."attacker_x" IS NULL
    OR cr."attacker_y" IS NULL
  );

UPDATE "combat_report" AS cr
SET
  "defender_village_name" = v."name",
  "defender_x" = v."x",
  "defender_y" = v."y"
FROM "village" AS v
WHERE v."id" = cr."defender_village_id"
  AND (
    cr."defender_village_name" IS NULL
    OR cr."defender_x" IS NULL
    OR cr."defender_y" IS NULL
  );

UPDATE "combat_report" AS cr
SET
  "defender_village_name" = v."name",
  "defender_x" = v."x",
  "defender_y" = v."y"
FROM "village" AS v
WHERE cr."defender_village_id" IS NULL
  AND v."world_id" = cr."world_id"
  AND v."x" = cr."target_x"
  AND v."y" = cr."target_y"
  AND (
    cr."defender_village_name" IS NULL
    OR cr."defender_x" IS NULL
    OR cr."defender_y" IS NULL
  );

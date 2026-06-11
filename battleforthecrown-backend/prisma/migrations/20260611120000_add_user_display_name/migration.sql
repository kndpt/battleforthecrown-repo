-- Add global public player display name (account-scoped, not world-scoped).
ALTER TABLE "user" ADD COLUMN "display_name" TEXT;

WITH candidates AS (
  SELECT
    id,
    'Joueur_' || RIGHT(id, 6) AS proposed,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER('Joueur_' || RIGHT(id, 6))
      ORDER BY created_at, id
    ) AS dup_rank
  FROM "user"
)
UPDATE "user" u
SET "display_name" = CASE
  WHEN c.dup_rank > 1 THEN c.proposed || '_' || c.dup_rank::text
  ELSE c.proposed
END
FROM candidates c
WHERE u.id = c.id;

ALTER TABLE "user" ALTER COLUMN "display_name" SET NOT NULL;

-- Case-insensitive uniqueness (not expressible as Prisma @unique on LOWER()).
CREATE UNIQUE INDEX "user_display_name_lower_key" ON "user" (LOWER("display_name"));

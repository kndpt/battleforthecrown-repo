-- Taxonomie v2 des traits naturels (spec 27) : ajoute HILL (Colline) et
-- FERTILE_SOIL (Terre fertile) à l'enum. Migration option (a) « nouveaux
-- villages uniquement » : AUCUN backfill/re-dérivation des villages existants —
-- ils gardent leur trait v1, l'invariant « trait fixe » de la spec 27 est
-- préservé. Les nouveaux traits n'apparaissent donc que sur les villages créés
-- après cette migration. Aucun NULL introduit (colonne déjà NOT NULL, remplie
-- par la migration backfill du run 088).
--
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VillageNaturalTrait" ADD VALUE 'HILL';
ALTER TYPE "VillageNaturalTrait" ADD VALUE 'FERTILE_SOIL';

-- The task modal already collected a description with nowhere to store it.
-- AlterTable
ALTER TABLE "ProjectTask" ADD COLUMN "description" TEXT;


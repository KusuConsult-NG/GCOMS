-- The previous migration added `progress` with a default of 0, which left
-- already-COMPLETED milestones reporting 0% — a donor-facing number that would
-- have been wrong on every existing database. Align them with their status.
UPDATE "GrantMilestone" SET "progress" = 100 WHERE "status" = 'COMPLETED' AND "progress" = 0;

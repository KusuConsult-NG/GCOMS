-- Leave requests collected a reason with nowhere to store it, and clinical
-- investigations had no field for the recommendation drawn from the results.
-- AlterTable
ALTER TABLE "Investigation" ADD COLUMN "recommendation" TEXT;

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN "reason" TEXT;


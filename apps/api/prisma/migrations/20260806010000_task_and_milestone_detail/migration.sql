-- Adds the fields the task board and milestone tracker already displayed from
-- hardcoded browser state: assignee/dueDate/priority on tasks, metric/progress
-- on milestones. Existing rows keep their values and take the column defaults.

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GrantMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metric" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GrantMilestone_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GrantMilestone" ("createdAt", "dueDate", "grantId", "id", "status", "title", "updatedAt") SELECT "createdAt", "dueDate", "grantId", "id", "status", "title", "updatedAt" FROM "GrantMilestone";
DROP TABLE "GrantMilestone";
ALTER TABLE "new_GrantMilestone" RENAME TO "GrantMilestone";
CREATE INDEX "GrantMilestone_grantId_idx" ON "GrantMilestone"("grantId");
CREATE TABLE "new_ProjectTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignee" TEXT,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProjectTask" ("createdAt", "id", "projectId", "status", "title", "updatedAt") SELECT "createdAt", "id", "projectId", "status", "title", "updatedAt" FROM "ProjectTask";
DROP TABLE "ProjectTask";
ALTER TABLE "new_ProjectTask" RENAME TO "ProjectTask";
CREATE INDEX "ProjectTask_projectId_idx" ON "ProjectTask"("projectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


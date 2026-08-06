-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BoardResolution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resolutionNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolutionType" TEXT NOT NULL DEFAULT 'POLICY',
    "meetingDate" DATETIME,
    "proposedBy" TEXT,
    "secondedBy" TEXT,
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "abstentions" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PASSED',
    "passedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_BoardResolution" ("abstentions", "description", "id", "passedDate", "resolutionNo", "status", "title", "votesAgainst", "votesFor") SELECT "abstentions", "description", "id", "passedDate", "resolutionNo", "status", "title", "votesAgainst", "votesFor" FROM "BoardResolution";
DROP TABLE "BoardResolution";
ALTER TABLE "new_BoardResolution" RENAME TO "BoardResolution";
CREATE UNIQUE INDEX "BoardResolution_resolutionNo_key" ON "BoardResolution"("resolutionNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

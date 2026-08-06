-- Adds a system-assigned registrationId, frees nationalId to hold an actual
-- National Identification Number, and stores outreach location as structured
-- fields instead of flattening them into `address`.
--
-- Backfill intent: rows whose nationalId looks like 'GC-PAT-%' were created by
-- the volunteer intake form, which generated a registration ID in the browser
-- and stored it in the nationalId column. Those values are moved to
-- registrationId and nationalId is cleared, because they were never national
-- IDs. Every other row keeps its nationalId and gets a registrationId derived
-- from its primary key, which is unique by construction.

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationId" TEXT NOT NULL,
    "nationalId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "address" TEXT,
    "lga" TEXT,
    "ward" TEXT,
    "gpsCoordinates" TEXT,
    "communityId" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT true,
    "registeredById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Participant_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Participant_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Participant" (
    "id", "registrationId", "nationalId", "firstName", "lastName", "dateOfBirth",
    "gender", "phoneNumber", "address", "consentGiven", "registeredById",
    "createdAt", "updatedAt"
)
SELECT
    "id",
    CASE WHEN "nationalId" LIKE 'GC-PAT-%'
         THEN "nationalId"
         ELSE 'GC-' || upper(replace("id", '-', '')) END,
    CASE WHEN "nationalId" LIKE 'GC-PAT-%'
         THEN NULL
         ELSE "nationalId" END,
    "firstName", "lastName", "dateOfBirth", "gender", "phoneNumber", "address",
    "consentGiven", "registeredById", "createdAt", "updatedAt"
FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
CREATE UNIQUE INDEX "Participant_registrationId_key" ON "Participant"("registrationId");
CREATE UNIQUE INDEX "Participant_nationalId_key" ON "Participant"("nationalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

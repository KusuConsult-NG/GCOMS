-- Upload metadata for documents. url becomes optional: a record is now either
-- an external link or an uploaded file, not always a URL.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DocumentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "url" TEXT,
    "storedName" TEXT,
    "originalName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "checksum" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DocumentRecord_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DocumentRecord" ("createdAt", "documentType", "id", "title", "updatedAt", "uploadedById", "url", "version") SELECT "createdAt", "documentType", "id", "title", "updatedAt", "uploadedById", "url", "version" FROM "DocumentRecord";
DROP TABLE "DocumentRecord";
ALTER TABLE "new_DocumentRecord" RENAME TO "DocumentRecord";
CREATE UNIQUE INDEX "DocumentRecord_storedName_key" ON "DocumentRecord"("storedName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


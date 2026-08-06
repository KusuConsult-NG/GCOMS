-- Money moves from Float to Decimal. Binary floating point cannot represent
-- 0.1 exactly, so a ledger built on it drifts: sums disagree with their parts
-- and reconciliations fail by cents. Decimal is exact.
--
-- The Postgres native attribute @db.Decimal(18,2) is added with the provider
-- switch; SQLite rejects it.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BankReconciliation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "statementDate" DATETIME NOT NULL,
    "bankBalance" REAL NOT NULL,
    "ledgerBalance" REAL NOT NULL,
    "discrepancy" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'RECONCILED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_BankReconciliation" ("bankBalance", "createdAt", "discrepancy", "id", "ledgerBalance", "notes", "statementDate", "status") SELECT "bankBalance", "createdAt", "discrepancy", "id", "ledgerBalance", "notes", "statementDate", "status" FROM "BankReconciliation";
DROP TABLE "BankReconciliation";
ALTER TABLE "new_BankReconciliation" RENAME TO "BankReconciliation";
CREATE TABLE "new_FinanceTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" DECIMAL NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinanceTransaction_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FinanceTransaction" ("amount", "category", "createdAt", "description", "id", "requestedById", "status", "type", "updatedAt") SELECT "amount", "category", "createdAt", "description", "id", "requestedById", "status", "type", "updatedAt" FROM "FinanceTransaction";
DROP TABLE "FinanceTransaction";
ALTER TABLE "new_FinanceTransaction" RENAME TO "FinanceTransaction";
CREATE TABLE "new_Grant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorName" TEXT NOT NULL,
    "grantName" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "managedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Grant_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Grant" ("amount", "createdAt", "donorName", "endDate", "grantName", "id", "managedById", "startDate", "status", "updatedAt") SELECT "amount", "createdAt", "donorName", "endDate", "grantName", "id", "managedById", "startDate", "status", "updatedAt" FROM "Grant";
DROP TABLE "Grant";
ALTER TABLE "new_Grant" RENAME TO "Grant";
CREATE TABLE "new_GrantProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "requestedAmount" DECIMAL NOT NULL,
    "submissionDeadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNDER_REVIEW',
    "leadAuthor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_GrantProposal" ("createdAt", "donorName", "id", "leadAuthor", "requestedAmount", "status", "submissionDeadline", "title") SELECT "createdAt", "donorName", "id", "leadAuthor", "requestedAmount", "status", "submissionDeadline", "title" FROM "GrantProposal";
DROP TABLE "GrantProposal";
ALTER TABLE "new_GrantProposal" RENAME TO "GrantProposal";
CREATE TABLE "new_ProcurementOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "estimatedCost" DECIMAL NOT NULL,
    "vendor" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProcurementOrder_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProcurementOrder" ("createdAt", "estimatedCost", "id", "itemName", "quantity", "requestedById", "status", "updatedAt", "vendor") SELECT "createdAt", "estimatedCost", "id", "itemName", "quantity", "requestedById", "status", "updatedAt", "vendor" FROM "ProcurementOrder";
DROP TABLE "ProcurementOrder";
ALTER TABLE "new_ProcurementOrder" RENAME TO "ProcurementOrder";
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "budget" DECIMAL NOT NULL,
    "managedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("budget", "createdAt", "description", "endDate", "id", "managedById", "projectName", "startDate", "status", "updatedAt") SELECT "budget", "createdAt", "description", "endDate", "id", "managedById", "projectName", "startDate", "status", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_RfqQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "warranty" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RfqQuote_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RfqQuote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RfqQuote" ("createdAt", "id", "price", "rfqId", "score", "status", "updatedAt", "vendorId", "warranty") SELECT "createdAt", "id", "price", "rfqId", "score", "status", "updatedAt", "vendorId", "warranty" FROM "RfqQuote";
DROP TABLE "RfqQuote";
ALTER TABLE "new_RfqQuote" RENAME TO "RfqQuote";
CREATE INDEX "RfqQuote_rfqId_idx" ON "RfqQuote"("rfqId");
CREATE UNIQUE INDEX "RfqQuote_rfqId_vendorId_key" ON "RfqQuote"("rfqId", "vendorId");
CREATE TABLE "new_VolunteerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "ward" TEXT,
    "address" TEXT,
    "stipend" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VolunteerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VolunteerProfile" ("address", "createdAt", "id", "lga", "status", "stipend", "updatedAt", "userId", "ward") SELECT "address", "createdAt", "id", "lga", "status", "stipend", "updatedAt", "userId", "ward" FROM "VolunteerProfile";
DROP TABLE "VolunteerProfile";
ALTER TABLE "new_VolunteerProfile" RENAME TO "VolunteerProfile";
CREATE UNIQUE INDEX "VolunteerProfile_userId_key" ON "VolunteerProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


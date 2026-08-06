-- Eleven models in schema.prisma were never created by any migration:
-- VitalSign, MedicalHistory, Appointment, NotificationItem, ProjectTask,
-- GrantMilestone, BankReconciliation, EquipmentServiceLog, BoardResolution,
-- OnboardingChecklist and GrantProposal.
--
-- Development databases have them because someone ran `prisma db push`, which
-- syncs the schema without recording a migration. Any database built from the
-- migration history alone — CI, a fresh deploy — was missing them, including
-- the tables behind vitals, medical history and appointments.
--
-- Written with IF NOT EXISTS so it is a no-op on databases that already drifted
-- into having them.

-- AlterTable
ALTER TABLE "ApprovalRequest" ADD COLUMN "comments" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "GrantMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "metric" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GrantMilestone_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProjectTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "assignee" TEXT,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "VitalSign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bpSystolic" INTEGER,
    "bpDiastolic" INTEGER,
    "pulseRate" INTEGER,
    "temperature" REAL,
    "weightKg" REAL,
    "heightCm" REAL,
    "bmi" REAL,
    "oxygenSat" REAL,
    "participantId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VitalSign_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MedicalHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conditionName" TEXT NOT NULL,
    "diagnosisDate" DATETIME,
    "familyHistory" TEXT,
    "lifestyleNotes" TEXT,
    "allergies" TEXT,
    "participantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MedicalHistory_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduledAt" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FOLLOW_UP',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "participantId" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NotificationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipient" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BankReconciliation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "statementDate" DATETIME NOT NULL,
    "bankBalance" REAL NOT NULL,
    "ledgerBalance" REAL NOT NULL,
    "discrepancy" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'RECONCILED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EquipmentServiceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryItemId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "serviceDate" DATETIME NOT NULL,
    "nextDueDate" DATETIME NOT NULL,
    "cost" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BoardResolution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resolutionNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "abstentions" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PASSED',
    "passedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OnboardingChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "identityVerified" BOOLEAN NOT NULL DEFAULT true,
    "contractSigned" BOOLEAN NOT NULL DEFAULT true,
    "itProvisioned" BOOLEAN NOT NULL DEFAULT true,
    "medicalCleared" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GrantProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "requestedAmount" REAL NOT NULL,
    "submissionDeadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNDER_REVIEW',
    "leadAuthor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GrantMilestone_grantId_idx" ON "GrantMilestone"("grantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProjectTask_projectId_idx" ON "ProjectTask"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BoardResolution_resolutionNo_key" ON "BoardResolution"("resolutionNo");


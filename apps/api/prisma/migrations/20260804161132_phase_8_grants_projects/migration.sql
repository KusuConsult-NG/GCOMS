-- CreateTable
CREATE TABLE "Grant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorName" TEXT NOT NULL,
    "grantName" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "managedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Grant_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "budget" REAL NOT NULL,
    "managedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

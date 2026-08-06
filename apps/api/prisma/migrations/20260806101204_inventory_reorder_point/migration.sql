-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "minThreshold" INTEGER NOT NULL DEFAULT 10,
    "unitPrice" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "managedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InventoryItem" ("category", "createdAt", "id", "itemName", "location", "managedById", "quantity", "status", "unit", "updatedAt") SELECT "category", "createdAt", "id", "itemName", "location", "managedById", "quantity", "status", "unit", "updatedAt" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

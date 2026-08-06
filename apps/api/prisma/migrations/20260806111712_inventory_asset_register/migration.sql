-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN "assetTag" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN "assignedTo" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN "condition" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN "currentLocation" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN "serialNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_assetTag_key" ON "InventoryItem"("assetTag");


-- AlterTable
ALTER TABLE "Participant" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Participant_idempotencyKey_key" ON "Participant"("idempotencyKey");

-- AlterTable
ALTER TABLE "Rfq" ADD COLUMN     "technicalWeight" INTEGER NOT NULL DEFAULT 70;

-- AlterTable
ALTER TABLE "RfqQuote" ADD COLUMN     "combinedScore" INTEGER,
ADD COLUMN     "evaluatedAt" TIMESTAMP(3),
ADD COLUMN     "financialScore" INTEGER;

-- CreateTable
CREATE TABLE "RfqCriterion" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 10,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RfqCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteCriterionScore" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteCriterionScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RfqCriterion_rfqId_idx" ON "RfqCriterion"("rfqId");

-- CreateIndex
CREATE INDEX "QuoteCriterionScore_quoteId_idx" ON "QuoteCriterionScore"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteCriterionScore_quoteId_criterionId_key" ON "QuoteCriterionScore"("quoteId", "criterionId");

-- AddForeignKey
ALTER TABLE "RfqCriterion" ADD CONSTRAINT "RfqCriterion_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteCriterionScore" ADD CONSTRAINT "QuoteCriterionScore_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "RfqQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteCriterionScore" ADD CONSTRAINT "QuoteCriterionScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "RfqCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "ServiceHistoryStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ServiceLineItemType" AS ENUM ('SERVICE', 'PART', 'LABOR', 'OTHER');

ALTER TABLE "ServiceHistory" RENAME COLUMN "serviceDate" TO "visitDate";
ALTER TABLE "ServiceHistory" RENAME COLUMN "currentMileage" TO "mileageAtService";
ALTER TABLE "ServiceHistory" RENAME COLUMN "description" TO "initialRequest";

ALTER TABLE "ServiceHistory"
  ADD COLUMN "appointmentId" UUID,
  ADD COLUMN "status" "ServiceHistoryStatus" NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN "customerComplaint" TEXT,
  ADD COLUMN "diagnosis" TEXT,
  ADD COLUMN "workSummary" TEXT,
  ADD COLUMN "recommendations" TEXT,
  ADD COLUMN "internalNotes" TEXT,
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "createdBy" UUID,
  ADD COLUMN "completedBy" UUID,
  ADD COLUMN "cancelledBy" UUID,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Records created by the previous API represented completed work. Preserve that
-- meaning and timestamp, but do not invent user attribution that was never stored.
UPDATE "ServiceHistory"
SET "completedAt" = "updatedAt"
WHERE "status" = 'COMPLETED';

CREATE TABLE "ServiceLineItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "serviceHistoryId" UUID NOT NULL,
  "type" "ServiceLineItemType" NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(10,3) NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "notes" TEXT,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ServiceLineItem_pkey" PRIMARY KEY ("id")
);

-- Preserve the previous unstructured charge as an OTHER line item. This retains
-- the exact Decimal amount without pretending it was a service, part, or labor.
INSERT INTO "ServiceLineItem" (
  "tenantId", "serviceHistoryId", "type", "description", "quantity",
  "unitPrice", "sortOrder", "updatedAt"
)
SELECT "tenantId", "id", 'OTHER', "initialRequest", 1, "totalAmount", 0, CURRENT_TIMESTAMP
FROM "ServiceHistory"
WHERE "totalAmount" <> 0;

ALTER TABLE "ServiceHistory" DROP COLUMN "totalAmount";

DROP INDEX IF EXISTS "ServiceHistory_tenantId_customerId_serviceDate_idx";
DROP INDEX IF EXISTS "ServiceHistory_tenantId_vehicleId_serviceDate_idx";
DROP INDEX IF EXISTS "ServiceHistory_tenantId_branchId_serviceDate_idx";

CREATE UNIQUE INDEX "ServiceHistory_id_tenantId_key" ON "ServiceHistory"("id", "tenantId");
CREATE UNIQUE INDEX "ServiceHistory_appointmentId_key" ON "ServiceHistory"("appointmentId");
CREATE INDEX "ServiceHistory_tenantId_deletedAt_visitDate_idx" ON "ServiceHistory"("tenantId", "deletedAt", "visitDate");
CREATE INDEX "ServiceHistory_tenantId_branchId_visitDate_idx" ON "ServiceHistory"("tenantId", "branchId", "visitDate");
CREATE INDEX "ServiceHistory_tenantId_customerId_visitDate_idx" ON "ServiceHistory"("tenantId", "customerId", "visitDate");
CREATE INDEX "ServiceHistory_tenantId_vehicleId_visitDate_idx" ON "ServiceHistory"("tenantId", "vehicleId", "visitDate");
CREATE INDEX "ServiceHistory_tenantId_status_visitDate_idx" ON "ServiceHistory"("tenantId", "status", "visitDate");
CREATE UNIQUE INDEX "ServiceLineItem_id_tenantId_key" ON "ServiceLineItem"("id", "tenantId");
CREATE INDEX "ServiceLineItem_tenantId_serviceHistoryId_deletedAt_sortOrder_idx" ON "ServiceLineItem"("tenantId", "serviceHistoryId", "deletedAt", "sortOrder");

ALTER TABLE "ServiceHistory" ADD CONSTRAINT "ServiceHistory_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceHistory" ADD CONSTRAINT "ServiceHistory_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceHistory" ADD CONSTRAINT "ServiceHistory_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceHistory" ADD CONSTRAINT "ServiceHistory_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceLineItem" ADD CONSTRAINT "ServiceLineItem_serviceHistoryId_tenantId_fkey" FOREIGN KEY ("serviceHistoryId", "tenantId") REFERENCES "ServiceHistory"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceHistory" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

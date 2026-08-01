-- Branches own local operational settings. Existing tenant timezones are copied to
-- a legacy branch so existing service records retain a required branch reference.
CREATE TABLE "Branch" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "stateProvince" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "businessOpeningTime" TIME(0) NOT NULL,
    "businessClosingTime" TIME(0) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- Tenant registrations before Branches did not collect address or phone data.
-- The generated inactive legacy branch preserves relational integrity and must be
-- completed through PATCH before it is used for new service records.
INSERT INTO "Branch" (
    "id", "tenantId", "name", "phone", "addressLine1", "city", "stateProvince", "postalCode", "country", "timezone",
    "businessOpeningTime", "businessClosingTime", "isActive", "updatedAt"
)
SELECT "id", "id", "name" || ' (legacy branch)', '0000000', 'Pending address', 'Pending city', 'Pending state', 'Pending postal code', 'Pending country', "timezone", '09:00:00', '17:00:00', false, CURRENT_TIMESTAMP
FROM "Tenant";

ALTER TABLE "ServiceHistory" ADD COLUMN "branchId" UUID;
UPDATE "ServiceHistory" AS "serviceHistory"
SET "branchId" = "branch"."id"
FROM "Branch" AS "branch"
WHERE "branch"."tenantId" = "serviceHistory"."tenantId";
ALTER TABLE "ServiceHistory" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "Tenant" DROP COLUMN "timezone";

CREATE INDEX "Branch_tenantId_deletedAt_idx" ON "Branch"("tenantId", "deletedAt");
CREATE INDEX "Branch_tenantId_name_idx" ON "Branch"("tenantId", "name");
CREATE UNIQUE INDEX "Branch_id_tenantId_key" ON "Branch"("id", "tenantId");
CREATE INDEX "ServiceHistory_tenantId_branchId_serviceDate_idx" ON "ServiceHistory"("tenantId", "branchId", "serviceDate");

ALTER TABLE "Branch" ADD CONSTRAINT "Branch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceHistory" ADD CONSTRAINT "ServiceHistory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

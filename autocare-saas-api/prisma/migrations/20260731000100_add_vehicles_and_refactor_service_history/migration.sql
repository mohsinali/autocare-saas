-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'CNG');
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT');
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD', 'SCRAPPED');

-- CreateTable
CREATE TABLE "VehicleSequence" (
    "tenantId" UUID NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "VehicleSequence_pkey" PRIMARY KEY ("tenantId")
);

CREATE TABLE "Vehicle" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "vehicleCode" TEXT NOT NULL,
    "nickname" TEXT,
    "registrationNumber" TEXT,
    "vin" TEXT,
    "make" TEXT,
    "model" TEXT,
    "variant" TEXT,
    "year" INTEGER,
    "color" TEXT,
    "engineNumber" TEXT,
    "engineSize" TEXT,
    "fuelType" "FuelType",
    "transmission" "Transmission",
    "purchaseDate" TIMESTAMP(3),
    "currentMileage" INTEGER,
    "lastServiceMileage" INTEGER,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- Preserve pre-vehicle service history. Existing rows have no vehicle identity, so
-- vehicleId remains nullable at the database layer until an operator maps them to
-- real vehicles. All new application writes require vehicleId.
ALTER TABLE "ServiceHistory" RENAME COLUMN "mileage" TO "currentMileage";
ALTER TABLE "ServiceHistory" ADD COLUMN "vehicleId" UUID;

CREATE UNIQUE INDEX "Vehicle_tenantId_vehicleCode_key" ON "Vehicle"("tenantId", "vehicleCode");
CREATE UNIQUE INDEX "Vehicle_tenantId_registrationNumber_key" ON "Vehicle"("tenantId", "registrationNumber");
CREATE INDEX "Vehicle_tenantId_customerId_idx" ON "Vehicle"("tenantId", "customerId");
CREATE INDEX "Vehicle_tenantId_deletedAt_idx" ON "Vehicle"("tenantId", "deletedAt");
CREATE INDEX "Vehicle_tenantId_make_model_idx" ON "Vehicle"("tenantId", "make", "model");
CREATE INDEX "ServiceHistory_tenantId_vehicleId_serviceDate_idx" ON "ServiceHistory"("tenantId", "vehicleId", "serviceDate");

ALTER TABLE "VehicleSequence" ADD CONSTRAINT "VehicleSequence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceHistory" ADD CONSTRAINT "ServiceHistory_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

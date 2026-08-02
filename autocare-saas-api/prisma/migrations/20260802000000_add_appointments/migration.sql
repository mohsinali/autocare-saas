CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

CREATE TABLE "Appointment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "appointmentDateTimeUtc" TIMESTAMP(3) NOT NULL,
    "estimatedDurationMinutes" INTEGER NOT NULL,
    "serviceRequested" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Appointment_tenantId_deletedAt_appointmentDateTimeUtc_idx" ON "Appointment"("tenantId", "deletedAt", "appointmentDateTimeUtc");
CREATE INDEX "Appointment_tenantId_branchId_appointmentDateTimeUtc_idx" ON "Appointment"("tenantId", "branchId", "appointmentDateTimeUtc");
CREATE INDEX "Appointment_tenantId_customerId_appointmentDateTimeUtc_idx" ON "Appointment"("tenantId", "customerId", "appointmentDateTimeUtc");
CREATE INDEX "Appointment_tenantId_vehicleId_appointmentDateTimeUtc_idx" ON "Appointment"("tenantId", "vehicleId", "appointmentDateTimeUtc");
CREATE INDEX "Appointment_tenantId_status_appointmentDateTimeUtc_idx" ON "Appointment"("tenantId", "status", "appointmentDateTimeUtc");
CREATE UNIQUE INDEX "Appointment_id_tenantId_key" ON "Appointment"("id", "tenantId");
CREATE UNIQUE INDEX "Appointment_branchId_appointmentDateTimeUtc_active_key" ON "Appointment"("branchId", "appointmentDateTimeUtc") WHERE "deletedAt" IS NULL;

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

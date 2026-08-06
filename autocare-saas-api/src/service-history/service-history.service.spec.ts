import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma, ServiceHistoryStatus } from "@prisma/client";
import { DateTime } from "luxon";
import { ServiceHistoryService } from "./service-history.service";

describe("ServiceHistoryService", () => {
  const repository = {
    create: jest.fn(),
    list: jest.fn(),
    findById: jest.fn(),
    findAppointment: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    complete: jest.fn(),
    cancel: jest.fn(),
  };
  const vehicles = { findOne: jest.fn() };
  const customers = { findOne: jest.fn() };
  const branches = { findActiveOne: jest.fn() };
  const timezone = {
    convertLocalToUtc: jest.fn((value: string, zone: string) =>
      DateTime.fromISO(value, { zone }).toUTC().toJSDate(),
    ),
  };
  const service = new ServiceHistoryService(
    repository as never,
    vehicles as never,
    customers as never,
    branches as never,
    timezone as never,
  );
  const tenantId = "11111111-1111-4111-8111-111111111111";
  const userId = "22222222-2222-4222-8222-222222222222";
  const branch = {
    id: "33333333-3333-4333-8333-333333333333",
    timezone: "Asia/Karachi",
  };
  const customer = { id: "44444444-4444-4444-8444-444444444444" };
  const vehicle = {
    id: "55555555-5555-4555-8555-555555555555",
    customerId: customer.id,
  };

  function history(status: ServiceHistoryStatus = ServiceHistoryStatus.DRAFT) {
    return {
      id: "66666666-6666-4666-8666-666666666666",
      tenantId,
      branchId: branch.id,
      customerId: customer.id,
      vehicleId: vehicle.id,
      appointmentId: null,
      status,
      visitDate: new Date("2026-08-06T06:30:00.000Z"),
      mileageAtService: 100,
      customerComplaint: null,
      initialRequest: "Oil change",
      diagnosis: null,
      workSummary: null,
      recommendations: null,
      internalNotes: null,
      cancellationReason: null,
      completedAt: null,
      cancelledAt: null,
      createdBy: userId,
      completedBy: null,
      cancelledBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      branch,
      customer,
      vehicle: {
        ...vehicle,
        vehicleCode: "VH-1",
        registrationNumber: null,
        make: null,
        model: null,
        year: null,
        currentMileage: 100,
      },
      appointment: null,
      creator: null,
      completer: null,
      canceller: null,
      lineItems: [],
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    branches.findActiveOne.mockResolvedValue(branch);
    customers.findOne.mockResolvedValue(customer);
    vehicles.findOne.mockResolvedValue(vehicle);
    repository.create.mockResolvedValue(history());
    repository.findById.mockResolvedValue(history());
    repository.update.mockResolvedValue(history());
    repository.complete.mockResolvedValue(
      history(ServiceHistoryStatus.COMPLETED),
    );
    repository.cancel.mockResolvedValue(
      history(ServiceHistoryStatus.CANCELLED),
    );
  });

  it("creates a tenant-owned DRAFT and atomically nests Decimal line items", async () => {
    await service.create(tenantId, userId, {
      branchId: branch.id,
      customerId: customer.id,
      vehicleId: vehicle.id,
      visitDate: "2026-08-06T11:30:00",
      initialRequest: " Oil change ",
      lineItems: [
        {
          type: "LABOR",
          description: " Work ",
          quantity: "1.5",
          unitPrice: "20.00",
        },
      ],
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        customerId: customer.id,
        vehicleId: vehicle.id,
        status: ServiceHistoryStatus.DRAFT,
        visitDate: new Date("2026-08-06T06:30:00.000Z"),
        initialRequest: "Oil change",
        createdBy: userId,
        lineItems: {
          create: [
            expect.objectContaining({
              tenantId,
              description: "Work",
              quantity: new Prisma.Decimal("1.5"),
              unitPrice: new Prisma.Decimal("20.00"),
              sortOrder: 0,
            }),
          ],
        },
      }),
    );
  });

  it("rejects a vehicle that does not belong to the selected customer", async () => {
    vehicles.findOne.mockResolvedValue({
      ...vehicle,
      customerId: "other-customer",
    });
    await expect(
      service.create(tenantId, userId, {
        branchId: branch.id,
        customerId: customer.id,
        vehicleId: vehicle.id,
        visitDate: "2026-08-06T11:30:00",
        initialRequest: "Oil change",
      }),
    ).rejects.toThrow("Vehicle does not belong");
  });

  it("enforces tenant access and appointment ownership", async () => {
    repository.findById.mockResolvedValue(null);
    await expect(
      service.findOne("other-tenant", history().id),
    ).rejects.toBeInstanceOf(NotFoundException);
    repository.findAppointment.mockResolvedValue({
      id: "appointment",
      tenantId,
      branchId: "wrong-branch",
      customerId: customer.id,
      vehicleId: vehicle.id,
    });
    await expect(
      service.create(tenantId, userId, {
        branchId: branch.id,
        customerId: customer.id,
        vehicleId: vehicle.id,
        appointmentId: "appointment",
        visitDate: "2026-08-06T11:30:00",
        initialRequest: "Oil change",
      }),
    ).rejects.toThrow("Appointment does not match");
  });

  it.each([ServiceHistoryStatus.COMPLETED, ServiceHistoryStatus.CANCELLED])(
    "rejects normal update and deletion for %s records",
    async (status) => {
      repository.findById.mockResolvedValue(history(status));
      await expect(
        service.update(tenantId, history().id, { diagnosis: "Updated" }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.remove(tenantId, history().id),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it("updates editable draft fields after revalidating ownership", async () => {
    await service.update(tenantId, history().id, {
      diagnosis: " Worn pads ",
      mileageAtService: 125,
    });
    expect(repository.update).toHaveBeenCalledWith(
      tenantId,
      history().id,
      expect.objectContaining({
        branchId: branch.id,
        customerId: customer.id,
        vehicleId: vehicle.id,
        diagnosis: "Worn pads",
        mileageAtService: 125,
      }),
    );
  });

  it("uses authenticated users for dedicated completion and cancellation commands", async () => {
    await service.complete(tenantId, history().id, userId, {
      mileageAtService: 150,
    });
    await service.cancel(tenantId, history().id, userId, {
      reason: "No work performed",
    });
    expect(repository.complete).toHaveBeenCalledWith(
      tenantId,
      history().id,
      userId,
      150,
      undefined,
      undefined,
    );
    expect(repository.cancel).toHaveBeenCalledWith(
      tenantId,
      history().id,
      userId,
      "No work performed",
    );
  });
});

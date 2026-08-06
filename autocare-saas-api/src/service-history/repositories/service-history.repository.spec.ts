import { BadRequestException, ConflictException } from "@nestjs/common";
import { ServiceHistoryStatus } from "@prisma/client";
import { ServiceHistoryRepository } from "./service-history.repository";

describe("ServiceHistoryRepository lifecycle transactions", () => {
  const tenantId = "tenant";
  const id = "history";
  const userId = "user";
  const transaction = {
    serviceHistory: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    serviceLineItem: { count: jest.fn() },
    vehicle: { updateMany: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(
      async (callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
    ),
    serviceHistory: { findFirst: jest.fn() },
  };
  const repository = new ServiceHistoryRepository(prisma as never);
  const draft = {
    id,
    tenantId,
    status: ServiceHistoryStatus.DRAFT,
    mileageAtService: null,
    vehicle: { id: "vehicle", currentMileage: 100 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.serviceHistory.findFirst.mockResolvedValue(draft);
    transaction.serviceHistory.updateMany.mockResolvedValue({ count: 1 });
    transaction.serviceHistory.update.mockResolvedValue({});
    transaction.serviceLineItem.count.mockResolvedValue(0);
    transaction.vehicle.updateMany.mockResolvedValue({ count: 1 });
    prisma.serviceHistory.findFirst.mockResolvedValue({
      ...draft,
      status: ServiceHistoryStatus.COMPLETED,
      lineItems: [],
    });
  });

  it("requires mileage and rejects mileage lower than the vehicle value", async () => {
    await expect(
      repository.complete(tenantId, id, userId, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      repository.complete(tenantId, id, userId, 99),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.vehicle.updateMany).not.toHaveBeenCalled();
  });

  it("finalizes history and vehicle mileage in the same serializable transaction", async () => {
    await repository.complete(tenantId, id, userId, 150);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.serviceHistory.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          status: ServiceHistoryStatus.DRAFT,
        }),
        data: expect.objectContaining({
          status: ServiceHistoryStatus.COMPLETED,
          mileageAtService: 150,
          completedBy: userId,
        }),
      }),
    );
    expect(transaction.vehicle.updateMany).toHaveBeenCalledWith({
      where: {
        id: "vehicle",
        tenantId,
        deletedAt: null,
        currentMileage: { lte: 150 },
      },
      data: { currentMileage: 150, lastServiceMileage: 150 },
    });
  });

  it("rejects a second completion without touching vehicle mileage", async () => {
    transaction.serviceHistory.findFirst.mockResolvedValue({
      ...draft,
      status: ServiceHistoryStatus.COMPLETED,
    });
    await expect(
      repository.complete(tenantId, id, userId, 150),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.vehicle.updateMany).not.toHaveBeenCalled();
  });

  it("cancels an empty draft without updating mileage", async () => {
    prisma.serviceHistory.findFirst.mockResolvedValue({
      ...draft,
      status: ServiceHistoryStatus.CANCELLED,
      lineItems: [],
    });
    await repository.cancel(tenantId, id, userId, "No work");
    expect(transaction.serviceHistory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ServiceHistoryStatus.CANCELLED,
          cancelledBy: userId,
          cancellationReason: "No work",
        }),
      }),
    );
    expect(transaction.vehicle.updateMany).not.toHaveBeenCalled();
  });

  it("rejects cancellation when active line items exist", async () => {
    transaction.serviceLineItem.count.mockResolvedValue(1);
    await expect(
      repository.cancel(tenantId, id, userId),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.serviceHistory.update).not.toHaveBeenCalled();
  });
});

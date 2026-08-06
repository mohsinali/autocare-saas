import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma, ServiceHistoryStatus } from "@prisma/client";
import { ServiceLineItemService } from "./service-line-item.service";

describe("ServiceLineItemService", () => {
  const repository = {
    create: jest.fn(),
    list: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
  const histories = { findById: jest.fn() };
  const service = new ServiceLineItemService(
    repository as never,
    histories as never,
  );
  const item = {
    id: "item",
    tenantId: "tenant",
    serviceHistoryId: "history",
    type: "LABOR",
    description: "Labor",
    quantity: new Prisma.Decimal("1.5"),
    unitPrice: new Prisma.Decimal("10.10"),
    notes: null,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    histories.findById.mockResolvedValue({
      id: "history",
      tenantId: "tenant",
      status: ServiceHistoryStatus.DRAFT,
    });
    repository.create.mockResolvedValue(item);
    repository.list.mockResolvedValue([
      item,
      {
        ...item,
        id: "item-2",
        quantity: new Prisma.Decimal("0.5"),
        unitPrice: new Prisma.Decimal("0.10"),
      },
    ]);
    repository.findById.mockResolvedValue(item);
    repository.update.mockResolvedValue(item);
  });

  it("adds, updates, and soft-deletes line items on a draft", async () => {
    await expect(
      service.create("tenant", "history", {
        type: "LABOR",
        description: " Labor ",
        quantity: "1.5",
        unitPrice: "10.10",
      }),
    ).resolves.toEqual(expect.objectContaining({ lineTotal: "15.15" }));
    await service.update("tenant", "history", "item", { quantity: "2" });
    await service.remove("tenant", "history", "item");
    expect(repository.create).toHaveBeenCalledWith(
      "tenant",
      "history",
      expect.objectContaining({
        description: "Labor",
        quantity: new Prisma.Decimal("1.5"),
      }),
    );
    expect(repository.update).toHaveBeenCalled();
    expect(repository.softDelete).toHaveBeenCalledWith("tenant", "item");
  });

  it.each([ServiceHistoryStatus.COMPLETED, ServiceHistoryStatus.CANCELLED])(
    "rejects line-item changes when the parent is %s",
    async (status) => {
      histories.findById.mockResolvedValue({ status });
      await expect(
        service.create("tenant", "history", {
          type: "OTHER",
          description: "Item",
          quantity: "1",
          unitPrice: "0",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.update("tenant", "history", "item", { description: "Changed" }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.remove("tenant", "history", "item"),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it("enforces tenant access through the parent", async () => {
    histories.findById.mockResolvedValue(null);
    await expect(
      service.findOne("other-tenant", "history", "item"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it("uses Decimal arithmetic for line totals and subtotal", async () => {
    await expect(service.list("tenant", "history")).resolves.toEqual({
      data: [
        expect.objectContaining({ lineTotal: "15.15" }),
        expect.objectContaining({ lineTotal: "0.05" }),
      ],
      subtotal: "15.20",
    });
  });

  it("rejects non-positive quantity and negative unit price at the domain boundary", async () => {
    await expect(
      service.create("tenant", "history", {
        type: "OTHER",
        description: "Item",
        quantity: "0",
        unitPrice: "1",
      }),
    ).rejects.toThrow("Quantity");
    await expect(
      service.create("tenant", "history", {
        type: "OTHER",
        description: "Item",
        quantity: "1",
        unitPrice: "-0.01",
      }),
    ).rejects.toThrow("Unit price");
  });
});

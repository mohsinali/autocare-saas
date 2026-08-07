import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import {
  InvoiceStatus,
  Prisma,
  ServiceHistoryStatus,
  ServiceLineItemType,
} from "@prisma/client";
import { InvoiceCalculatorService } from "./invoice-calculator.service";
import { InvoicesService } from "./invoices.service";

const tenantId = "70a5c60c-bcbd-46b9-872d-e00608447d10";
const invoiceId = "cc70d952-c2a7-44c9-a5cb-039767ccf1e6";
const historyId = "f3190b32-24bc-40fd-a336-94be61b68f56";

describe("InvoicesService", () => {
  const invoice = (status: InvoiceStatus) => ({
    id: invoiceId,
    tenantId,
    status,
    discountAmount: new Prisma.Decimal(0),
  });

  function service(
    prismaOverrides: Record<string, unknown> = {},
    nextValue = 1,
  ) {
    const prisma = {
      invoice: {
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      ...prismaOverrides,
    };
    return {
      prisma,
      subject: new InvoicesService(
        prisma as never,
        { nextValue: jest.fn().mockResolvedValue(nextValue) } as never,
        new InvoiceCalculatorService(),
      ),
    };
  }

  it("creates INV-001 with independent calculated Service Line Item snapshots", async () => {
    const create = jest.fn().mockImplementation(({ data }) => data);
    const tx = {
      serviceHistory: {
        findFirst: jest.fn().mockResolvedValue({
          id: historyId,
          tenantId,
          branchId: "branch",
          customerId: "customer",
          status: ServiceHistoryStatus.COMPLETED,
          vehicle: { id: "vehicle" },
          invoice: null,
          lineItems: [
            {
              id: "source-item",
              type: ServiceLineItemType.PART,
              description: "Filter snapshot",
              quantity: new Prisma.Decimal("2"),
              unitPrice: new Prisma.Decimal("12.50"),
              sortOrder: 3,
            },
          ],
        }),
      },
      invoice: { create },
    };
    const { subject } = service({
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    });
    const result = await subject.createFromServiceHistory(tenantId, historyId);
    expect(result.invoiceNumber).toBe("INV-001");
    expect(result.subtotal.toFixed(2)).toBe("25.00");
    const createdData = create.mock.calls[0][0].data;
    expect(createdData.lineItems.create[0]).toEqual(
      expect.objectContaining({
        serviceLineItemId: "source-item",
        description: "Filter snapshot",
        lineSubtotal: new Prisma.Decimal("25"),
        lineTotal: new Prisma.Decimal("25"),
      }),
    );
  });

  it("formats the next sequence as INV-002", async () => {
    const tx = {
      serviceHistory: {
        findFirst: jest.fn().mockResolvedValue({
          id: historyId,
          branchId: "branch",
          customerId: "customer",
          status: ServiceHistoryStatus.COMPLETED,
          vehicle: { id: "vehicle" },
          invoice: null,
          lineItems: [],
        }),
      },
      invoice: { create: jest.fn().mockImplementation(({ data }) => data) },
    };
    const { subject } = service(
      {
        $transaction: (callback: (client: typeof tx) => unknown) =>
          callback(tx),
      },
      2,
    );
    expect(
      (await subject.createFromServiceHistory(tenantId, historyId))
        .invoiceNumber,
    ).toBe("INV-002");
  });

  it("prevents a second invoice, including a void invoice", async () => {
    const tx = {
      serviceHistory: {
        findFirst: jest
          .fn()
          .mockResolvedValue({
            status: ServiceHistoryStatus.COMPLETED,
            vehicle: {},
            invoice: { id: invoiceId },
          }),
      },
    };
    const { subject } = service({
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    });
    await expect(
      subject.createFromServiceHistory(tenantId, historyId),
    ).rejects.toThrow(ConflictException);
  });

  it("hides another tenant's Service History as not found", async () => {
    const tx = {
      serviceHistory: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const { subject } = service({
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    });
    await expect(
      subject.createFromServiceHistory(tenantId, historyId),
    ).rejects.toThrow(NotFoundException);
    expect(tx.serviceHistory.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId }) }),
    );
  });

  it("allows completed histories with no line items as drafts", async () => {
    const tx = {
      serviceHistory: {
        findFirst: jest
          .fn()
          .mockResolvedValue({
            id: historyId,
            branchId: "b",
            customerId: "c",
            status: ServiceHistoryStatus.COMPLETED,
            vehicle: { id: "v" },
            invoice: null,
            lineItems: [],
          }),
      },
      invoice: { create: jest.fn().mockImplementation(({ data }) => data) },
    };
    const { subject } = service({
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    });
    const result = await subject.createFromServiceHistory(tenantId, historyId);
    expect(result.status).toBeUndefined();
    expect(result.totalAmount.toFixed(2)).toBe("0.00");
  });

  it("rejects cancelled or draft Service Histories", async () => {
    const tx = {
      serviceHistory: {
        findFirst: jest
          .fn()
          .mockResolvedValue({
            status: ServiceHistoryStatus.CANCELLED,
            vehicle: {},
            invoice: null,
          }),
      },
    };
    const { subject } = service({
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    });
    await expect(
      subject.createFromServiceHistory(tenantId, historyId),
    ).rejects.toThrow(BadRequestException);
  });

  it("marks only an issued invoice paid", async () => {
    const { subject, prisma } = service();
    prisma.invoice.findFirst.mockResolvedValue(invoice(InvoiceStatus.ISSUED));
    prisma.invoice.update.mockResolvedValue(invoice(InvoiceStatus.PAID));
    await subject.markPaid(tenantId, invoiceId);
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: InvoiceStatus.PAID,
          paidAt: expect.any(Date),
        }),
      }),
    );
    prisma.invoice.findFirst.mockResolvedValue(invoice(InvoiceStatus.DRAFT));
    await expect(subject.markPaid(tenantId, invoiceId)).rejects.toThrow(
      ConflictException,
    );
  });

  it("rejects issuing an invoice without line items", async () => {
    const tx = {
      invoice: { findFirst: jest.fn().mockResolvedValue(invoice(InvoiceStatus.DRAFT)) },
      invoiceLineItem: { count: jest.fn().mockResolvedValue(0) },
    };
    const { subject } = service({
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    });
    await expect(subject.issue(tenantId, invoiceId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("adds and calculates a line item only on a draft invoice", async () => {
    const created = jest.fn();
    const tx = {
      invoice: {
        findFirst: jest.fn().mockResolvedValue(invoice(InvoiceStatus.DRAFT)),
        update: jest.fn(),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: invoiceId }),
      },
      invoiceLineItem: {
        create: created,
        findMany: jest.fn().mockResolvedValue([
          { lineSubtotal: new Prisma.Decimal("20"), taxAmount: new Prisma.Decimal("2") },
        ]),
      },
    };
    const { subject } = service({
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    });
    await subject.addLineItem(tenantId, invoiceId, {
      description: "Manual fee",
      quantity: "2",
      unitPrice: "10",
      taxRate: "10",
      sortOrder: 4,
    });
    expect(created).toHaveBeenCalledWith({
      data: expect.objectContaining({
        lineSubtotal: new Prisma.Decimal("20"),
        taxAmount: new Prisma.Decimal("2"),
        lineTotal: new Prisma.Decimal("22"),
      }),
    });
    expect(tx.invoice.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalAmount: new Prisma.Decimal("22") }),
      }),
    );
    tx.invoice.findFirst.mockResolvedValue(invoice(InvoiceStatus.ISSUED));
    await expect(
      subject.addLineItem(tenantId, invoiceId, {
        description: "No",
        quantity: "1",
        unitPrice: "1",
      }),
    ).rejects.toThrow(ConflictException);
  });

  it("rejects deleting a line item that does not belong to the route invoice", async () => {
    const tx = {
      invoice: { findFirst: jest.fn().mockResolvedValue(invoice(InvoiceStatus.DRAFT)) },
      invoiceLineItem: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    const { subject } = service({
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    });
    await expect(
      subject.deleteLineItem(tenantId, invoiceId, historyId),
    ).rejects.toThrow(NotFoundException);
    expect(tx.invoiceLineItem.deleteMany).toHaveBeenCalledWith({
      where: { id: historyId, invoiceId },
    });
  });

  it.each([InvoiceStatus.DRAFT, InvoiceStatus.ISSUED])(
    "voids %s invoices",
    async (status) => {
      const { subject, prisma } = service();
      prisma.invoice.findFirst.mockResolvedValue(invoice(status));
      prisma.invoice.update.mockResolvedValue(invoice(InvoiceStatus.VOID));
      await subject.void(tenantId, invoiceId);
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: InvoiceStatus.VOID } }),
      );
    },
  );

  it.each([InvoiceStatus.PAID, InvoiceStatus.VOID])(
    "does not void %s invoices",
    async (status) => {
      const { subject, prisma } = service();
      prisma.invoice.findFirst.mockResolvedValue(invoice(status));
      await expect(subject.void(tenantId, invoiceId)).rejects.toThrow(
        ConflictException,
      );
    },
  );

  it("deletes only drafts without modifying the sequence", async () => {
    const { subject, prisma } = service();
    prisma.invoice.findFirst.mockResolvedValue(invoice(InvoiceStatus.DRAFT));
    await subject.remove(tenantId, invoiceId);
    expect(prisma.invoice.delete).toHaveBeenCalled();
    for (const status of [
      InvoiceStatus.ISSUED,
      InvoiceStatus.PAID,
      InvoiceStatus.VOID,
    ]) {
      prisma.invoice.findFirst.mockResolvedValue(invoice(status));
      await expect(subject.remove(tenantId, invoiceId)).rejects.toThrow(
        ConflictException,
      );
    }
    expect(prisma).not.toHaveProperty("sequence");
  });
});

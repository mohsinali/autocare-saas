import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InvoiceStatus,
  Prisma,
  SequenceKey,
  ServiceHistoryStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SequencesService } from "../sequences/sequences.service";
import { CreateInvoiceLineItemDto } from "./dto/create-invoice-line-item.dto";
import { InvoiceQueryDto } from "./dto/invoice-query.dto";
import { UpdateInvoiceLineItemDto } from "./dto/update-invoice-line-item.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { InvoiceCalculatorService } from "./invoice-calculator.service";

const invoiceInclude = {
  lineItems: {
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
  },
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      vehicleCode: true,
      registrationNumber: true,
      make: true,
      model: true,
      year: true,
    },
  },
  branch: { select: { id: true, name: true, timezone: true } },
  serviceHistory: {
    select: {
      id: true,
      status: true,
      visitDate: true,
      initialRequest: true,
      completedAt: true,
    },
  },
  tenant: { select: { currencyCode: true } },
} satisfies Prisma.InvoiceInclude;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequences: SequencesService,
    private readonly calculator: InvoiceCalculatorService,
  ) {}

  async createFromServiceHistory(tenantId: string, serviceHistoryId: string) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const history = await tx.serviceHistory.findFirst({
            where: { id: serviceHistoryId, tenantId, deletedAt: null },
            include: {
              branch: true,
              customer: true,
              vehicle: true,
              lineItems: {
                where: { deletedAt: null },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              },
              invoice: { select: { id: true } },
            },
          });
          if (!history)
            throw new NotFoundException("Service History not found");
          if (history.status !== ServiceHistoryStatus.COMPLETED)
            throw new BadRequestException(
              "Only completed Service History records may be invoiced",
            );
          if (!history.vehicle)
            throw new BadRequestException(
              "Service History must have a vehicle",
            );
          if (history.invoice)
            throw new ConflictException(
              "An invoice already exists for this service history.",
            );
          const value = await this.sequences.nextValue(
            tx,
            tenantId,
            SequenceKey.INVOICE,
          );
          const invoiceNumber = `INV-${value.toString().padStart(3, "0")}`;
          const calculatedLines = history.lineItems.map((item) => ({
            source: item,
            values: this.calculator.calculateLine({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: "0",
            }),
          }));
          const totals = this.calculator.calculateInvoice(
            calculatedLines.map(({ values }) => values),
            "0",
          );
          return tx.invoice.create({
            data: {
              tenantId,
              branchId: history.branchId,
              customerId: history.customerId,
              vehicleId: history.vehicle.id,
              serviceHistoryId: history.id,
              invoiceNumber,
              ...totals,
              lineItems: {
                create: calculatedLines.map(({ source, values }) => ({
                  serviceLineItemId: source.id,
                  type: source.type,
                  description: source.description,
                  quantity: values.quantity,
                  unitPrice: values.unitPrice,
                  taxRate: values.taxRate,
                  taxAmount: values.taxAmount,
                  lineSubtotal: values.lineSubtotal,
                  lineTotal: values.lineTotal,
                  sortOrder: source.sortOrder,
                })),
              },
            },
            include: invoiceInclude,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ConflictException(
          "An invoice already exists for this service history.",
        );
      throw error;
    }
  }

  async findAll(tenantId: string, query: InvoiceQueryDto) {
    if (
      query.issueDateFrom &&
      query.issueDateTo &&
      new Date(query.issueDateFrom) > new Date(query.issueDateTo)
    )
      throw new BadRequestException(
        "issueDateFrom must be before or equal to issueDateTo",
      );
    const where: Prisma.InvoiceWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.serviceHistoryId
        ? { serviceHistoryId: query.serviceHistoryId }
        : {}),
      ...(query.invoiceNumber
        ? {
            invoiceNumber: {
              contains: query.invoiceNumber,
              mode: "insensitive",
            },
          }
        : {}),
      ...(query.issueDateFrom || query.issueDateTo
        ? {
            issueDate: {
              ...(query.issueDateFrom
                ? { gte: new Date(query.issueDateFrom) }
                : {}),
              ...(query.issueDateTo
                ? { lte: new Date(query.issueDateTo) }
                : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                invoiceNumber: { contains: query.search, mode: "insensitive" },
              },
              {
                customer: {
                  firstName: { contains: query.search, mode: "insensitive" },
                },
              },
              {
                customer: {
                  lastName: { contains: query.search, mode: "insensitive" },
                },
              },
              {
                customer: {
                  email: { contains: query.search, mode: "insensitive" },
                },
              },
              {
                customer: {
                  phone: { contains: query.search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };
    const summaryInclude = {
      customer: invoiceInclude.customer,
      vehicle: invoiceInclude.vehicle,
      branch: invoiceInclude.branch,
    } satisfies Prisma.InvoiceInclude;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        include: summaryInclude,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOne(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: invoiceInclude,
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  async update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.requireInvoice(tx, tenantId, id);
      this.assertDraft(invoice.status);
      const discount = dto.discountAmount ?? invoice.discountAmount;
      await this.recalculate(tx, invoice.id, discount);
      await tx.invoice.update({
        where: { id_tenantId: { id, tenantId } },
        data: {
          ...(dto.dueDate !== undefined
            ? { dueDate: new Date(dto.dueDate) }
            : {}),
          ...(dto.taxLabel !== undefined
            ? { taxLabel: this.optionalText(dto.taxLabel) }
            : {}),
          ...(dto.notes !== undefined
            ? { notes: this.optionalText(dto.notes) }
            : {}),
          ...(dto.internalNotes !== undefined
            ? { internalNotes: this.optionalText(dto.internalNotes) }
            : {}),
        },
      });
      return tx.invoice.findUniqueOrThrow({
        where: { id },
        include: invoiceInclude,
      });
    });
  }

  async addLineItem(
    tenantId: string,
    invoiceId: string,
    dto: CreateInvoiceLineItemDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.requireInvoice(tx, tenantId, invoiceId);
      this.assertDraft(invoice.status);
      const values = this.calculator.calculateLine({
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        taxRate: dto.taxRate ?? "0",
      });
      await tx.invoiceLineItem.create({
        data: {
          invoiceId,
          type: dto.type,
          description: dto.description.trim(),
          sortOrder: dto.sortOrder ?? 0,
          ...values,
        },
      });
      await this.recalculate(tx, invoiceId, invoice.discountAmount);
      return tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: invoiceInclude,
      });
    });
  }

  async updateLineItem(
    tenantId: string,
    invoiceId: string,
    lineItemId: string,
    dto: UpdateInvoiceLineItemDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.requireInvoice(tx, tenantId, invoiceId);
      this.assertDraft(invoice.status);
      const item = await tx.invoiceLineItem.findFirst({
        where: { id: lineItemId, invoiceId },
      });
      if (!item) throw new NotFoundException("Invoice line item not found");
      const values = this.calculator.calculateLine({
        quantity: dto.quantity ?? item.quantity,
        unitPrice: dto.unitPrice ?? item.unitPrice,
        taxRate: dto.taxRate ?? item.taxRate,
      });
      await tx.invoiceLineItem.update({
        where: { id: lineItemId },
        data: {
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description.trim() }
            : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
          ...values,
        },
      });
      await this.recalculate(tx, invoiceId, invoice.discountAmount);
      return tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: invoiceInclude,
      });
    });
  }

  async deleteLineItem(
    tenantId: string,
    invoiceId: string,
    lineItemId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const invoice = await this.requireInvoice(tx, tenantId, invoiceId);
      this.assertDraft(invoice.status);
      const deleted = await tx.invoiceLineItem.deleteMany({
        where: { id: lineItemId, invoiceId },
      });
      if (deleted.count !== 1)
        throw new NotFoundException("Invoice line item not found");
      await this.recalculate(tx, invoiceId, invoice.discountAmount);
    });
  }

  async issue(tenantId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await this.requireInvoice(tx, tenantId, id);
      this.assertDraft(invoice.status);
      const count = await tx.invoiceLineItem.count({
        where: { invoiceId: id },
      });
      if (count === 0)
        throw new BadRequestException(
          "An invoice must have at least one line item before it can be issued",
        );
      await this.recalculate(tx, id, invoice.discountAmount);
      await tx.invoice.update({
        where: { id_tenantId: { id, tenantId } },
        data: { status: InvoiceStatus.ISSUED, issueDate: new Date() },
      });
      return tx.invoice.findUniqueOrThrow({
        where: { id },
        include: invoiceInclude,
      });
    });
  }

  async markPaid(tenantId: string, id: string) {
    const invoice = await this.requireInvoice(this.prisma, tenantId, id);
    if (invoice.status !== InvoiceStatus.ISSUED)
      throw new ConflictException("Only issued invoices may be marked as paid");
    return this.prisma.invoice.update({
      where: { id_tenantId: { id, tenantId } },
      data: { status: InvoiceStatus.PAID, paidAt: new Date() },
      include: invoiceInclude,
    });
  }

  async void(tenantId: string, id: string) {
    const invoice = await this.requireInvoice(this.prisma, tenantId, id);
    if (invoice.status === InvoiceStatus.PAID)
      throw new ConflictException("A paid invoice cannot be voided");
    if (
      invoice.status !== InvoiceStatus.DRAFT &&
      invoice.status !== InvoiceStatus.ISSUED
    )
      throw new ConflictException(
        "Only draft or issued invoices may be voided",
      );
    return this.prisma.invoice.update({
      where: { id_tenantId: { id, tenantId } },
      data: { status: InvoiceStatus.VOID },
      include: invoiceInclude,
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const invoice = await this.requireInvoice(this.prisma, tenantId, id);
    this.assertDraft(invoice.status, "Only draft invoices may be deleted");
    await this.prisma.invoice.delete({
      where: { id_tenantId: { id, tenantId } },
    });
  }

  private async recalculate(
    tx: Prisma.TransactionClient,
    invoiceId: string,
    discount: Prisma.Decimal | string,
  ) {
    const lines = await tx.invoiceLineItem.findMany({
      where: { invoiceId },
      select: { lineSubtotal: true, taxAmount: true },
    });
    const totals = this.calculator.calculateInvoice(lines, discount);
    await tx.invoice.update({ where: { id: invoiceId }, data: totals });
  }

  private async requireInvoice(
    tx: Prisma.TransactionClient | PrismaService,
    tenantId: string,
    id: string,
  ) {
    const invoice = await tx.invoice.findFirst({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  private assertDraft(
    status: InvoiceStatus,
    message = "Only draft invoices may be edited",
  ) {
    if (status !== InvoiceStatus.DRAFT) throw new ConflictException(message);
  }

  private optionalText(value: string): string | null {
    return value.trim() || null;
  }
}

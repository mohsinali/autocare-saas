import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ServiceHistoryStatus } from "@prisma/client";
import {
  CreateServiceLineItemDto,
  UpdateServiceLineItemDto,
} from "./dto/service-line-item.dto";
import { ServiceLineItemRepository } from "./repositories/service-line-item.repository";
import { ServiceHistoryRepository } from "./repositories/service-history.repository";
import { mapLineItem, ServiceLineItemResponse } from "./service-history.mapper";

@Injectable()
export class ServiceLineItemService {
  constructor(
    private readonly repository: ServiceLineItemRepository,
    private readonly histories: ServiceHistoryRepository,
  ) {}

  async create(
    tenantId: string,
    serviceHistoryId: string,
    dto: CreateServiceLineItemDto,
  ): Promise<ServiceLineItemResponse> {
    await this.assertDraftParent(tenantId, serviceHistoryId);
    this.assertMoney(dto.quantity, dto.unitPrice);
    return mapLineItem(
      await this.repository.create(tenantId, serviceHistoryId, {
        type: dto.type,
        description: dto.description.trim(),
        quantity: new Prisma.Decimal(dto.quantity),
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        notes: dto.notes?.trim() || null,
        sortOrder: dto.sortOrder,
      }),
    );
  }

  async list(
    tenantId: string,
    serviceHistoryId: string,
  ): Promise<{ data: ServiceLineItemResponse[]; subtotal: string }> {
    await this.assertParent(tenantId, serviceHistoryId);
    const items = await this.repository.list(tenantId, serviceHistoryId);
    const subtotal = items.reduce(
      (total, item) => total.add(item.quantity.mul(item.unitPrice)),
      new Prisma.Decimal(0),
    );
    return { data: items.map(mapLineItem), subtotal: subtotal.toFixed(2) };
  }

  async findOne(
    tenantId: string,
    serviceHistoryId: string,
    id: string,
  ): Promise<ServiceLineItemResponse> {
    await this.assertParent(tenantId, serviceHistoryId);
    const item = await this.repository.findById(tenantId, serviceHistoryId, id);
    if (!item) throw new NotFoundException("Service Line Item not found");
    return mapLineItem(item);
  }

  async update(
    tenantId: string,
    serviceHistoryId: string,
    id: string,
    dto: UpdateServiceLineItemDto,
  ): Promise<ServiceLineItemResponse> {
    await this.assertDraftParent(tenantId, serviceHistoryId);
    const existing = await this.repository.findById(
      tenantId,
      serviceHistoryId,
      id,
    );
    if (!existing) throw new NotFoundException("Service Line Item not found");
    if (dto.quantity !== undefined || dto.unitPrice !== undefined)
      this.assertMoney(
        dto.quantity ?? existing.quantity.toString(),
        dto.unitPrice ?? existing.unitPrice.toString(),
      );
    return mapLineItem(
      await this.repository.update(tenantId, id, {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.quantity !== undefined
          ? { quantity: new Prisma.Decimal(dto.quantity) }
          : {}),
        ...(dto.unitPrice !== undefined
          ? { unitPrice: new Prisma.Decimal(dto.unitPrice) }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() || null } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      }),
    );
  }

  async remove(
    tenantId: string,
    serviceHistoryId: string,
    id: string,
  ): Promise<void> {
    await this.assertDraftParent(tenantId, serviceHistoryId);
    const existing = await this.repository.findById(
      tenantId,
      serviceHistoryId,
      id,
    );
    if (!existing) throw new NotFoundException("Service Line Item not found");
    await this.repository.softDelete(tenantId, id);
  }

  private async assertParent(tenantId: string, id: string) {
    const history = await this.histories.findById(tenantId, id);
    if (!history) throw new NotFoundException("Service History not found");
    return history;
  }

  private async assertDraftParent(tenantId: string, id: string): Promise<void> {
    const history = await this.assertParent(tenantId, id);
    if (history.status !== ServiceHistoryStatus.DRAFT)
      throw new BadRequestException(
        "Line items can only be changed while Service History is draft",
      );
  }

  private assertMoney(quantity: string, unitPrice: string): void {
    const parsedQuantity = new Prisma.Decimal(quantity);
    const parsedUnitPrice = new Prisma.Decimal(unitPrice);
    if (parsedQuantity.lte(0))
      throw new BadRequestException("Quantity must be greater than zero");
    if (parsedUnitPrice.isNegative())
      throw new BadRequestException("Unit price must not be negative");
  }
}

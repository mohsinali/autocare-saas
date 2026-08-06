import { Injectable } from "@nestjs/common";
import { Prisma, ServiceLineItem } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ServiceLineItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    serviceHistoryId: string,
    data: Omit<
      Prisma.ServiceLineItemUncheckedCreateInput,
      "tenantId" | "serviceHistoryId" | "sortOrder"
    > & { sortOrder?: number },
  ): Promise<ServiceLineItem> {
    return this.prisma.$transaction(async (transaction) => {
      const aggregate =
        data.sortOrder === undefined
          ? await transaction.serviceLineItem.aggregate({
              where: { tenantId, serviceHistoryId, deletedAt: null },
              _max: { sortOrder: true },
            })
          : null;
      return transaction.serviceLineItem.create({
        data: {
          ...data,
          tenantId,
          serviceHistoryId,
          sortOrder: data.sortOrder ?? (aggregate?._max.sortOrder ?? -1) + 1,
        },
      });
    });
  }

  list(tenantId: string, serviceHistoryId: string): Promise<ServiceLineItem[]> {
    return this.prisma.serviceLineItem.findMany({
      where: {
        tenantId,
        serviceHistoryId,
        deletedAt: null,
        serviceHistory: { tenantId, deletedAt: null },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  findById(
    tenantId: string,
    serviceHistoryId: string,
    id: string,
  ): Promise<ServiceLineItem | null> {
    return this.prisma.serviceLineItem.findFirst({
      where: {
        id,
        tenantId,
        serviceHistoryId,
        deletedAt: null,
        serviceHistory: { tenantId, deletedAt: null },
      },
    });
  }

  update(
    tenantId: string,
    id: string,
    data: Prisma.ServiceLineItemUncheckedUpdateInput,
  ): Promise<ServiceLineItem> {
    return this.prisma.serviceLineItem.update({
      where: { id_tenantId: { id, tenantId } },
      data,
    });
  }

  softDelete(tenantId: string, id: string): Promise<ServiceLineItem> {
    return this.update(tenantId, id, { deletedAt: new Date() });
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma, ServiceHistory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class ServiceHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}
  create(data: Prisma.ServiceHistoryUncheckedCreateInput): Promise<ServiceHistory> { return this.prisma.serviceHistory.create({ data }); }
  listByCustomer(tenantId: string, customerId: string): Promise<ServiceHistory[]> { return this.prisma.serviceHistory.findMany({ where: { tenantId, customerId }, orderBy: { serviceDate: 'desc' } }); }
}

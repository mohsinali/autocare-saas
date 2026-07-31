import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CustomersService } from '../customers/customers.service';
import { CreateServiceHistoryDto } from './dto/create-service-history.dto';
import { ServiceHistoryRepository } from './repositories/service-history.repository';
@Injectable()
export class ServiceHistoryService {
  constructor(private readonly repository: ServiceHistoryRepository, private readonly customers: CustomersService) {}
  async create(tenantId: string, dto: CreateServiceHistoryDto) { await this.customers.findOne(tenantId, dto.customerId); return this.repository.create({ tenantId, customerId: dto.customerId, serviceDate: new Date(dto.serviceDate), description: dto.description, mileage: dto.mileage, totalAmount: new Prisma.Decimal(dto.totalAmount) }); }
  async listForCustomer(tenantId: string, customerId: string) { await this.customers.findOne(tenantId, customerId); return this.repository.listByCustomer(tenantId, customerId); }
}

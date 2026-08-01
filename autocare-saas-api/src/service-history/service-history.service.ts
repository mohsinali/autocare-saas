import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateServiceHistoryDto } from './dto/create-service-history.dto';
import { ServiceHistoryRepository } from './repositories/service-history.repository';
@Injectable()
export class ServiceHistoryService {
  constructor(private readonly repository: ServiceHistoryRepository, private readonly vehicles: VehiclesService) {}
  async create(tenantId: string, dto: CreateServiceHistoryDto) { await this.vehicles.findOne(tenantId, dto.vehicleId); return this.repository.create({ tenantId, vehicleId: dto.vehicleId, serviceDate: new Date(dto.serviceDate), description: dto.description, currentMileage: dto.currentMileage, totalAmount: new Prisma.Decimal(dto.totalAmount) }); }
  async listForVehicle(tenantId: string, vehicleId: string) { await this.vehicles.findOne(tenantId, vehicleId); return this.repository.listByVehicle(tenantId, vehicleId); }
}

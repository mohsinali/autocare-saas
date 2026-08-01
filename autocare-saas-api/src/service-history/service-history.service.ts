import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { VehiclesService } from '../vehicles/vehicles.service';
import { BranchesService } from '../branches/branches.service';
import { CreateServiceHistoryDto } from './dto/create-service-history.dto';
import { ServiceHistoryRepository } from './repositories/service-history.repository';
@Injectable()
export class ServiceHistoryService {
  constructor(private readonly repository: ServiceHistoryRepository, private readonly vehicles: VehiclesService, private readonly branches: BranchesService) {}
  async create(tenantId: string, dto: CreateServiceHistoryDto) { await Promise.all([this.vehicles.findOne(tenantId, dto.vehicleId), this.branches.findActiveOne(tenantId, dto.branchId)]); return this.repository.create({ tenantId, branchId: dto.branchId, vehicleId: dto.vehicleId, serviceDate: new Date(dto.serviceDate), description: dto.description, currentMileage: dto.currentMileage, totalAmount: new Prisma.Decimal(dto.totalAmount) }); }
  async listForVehicle(tenantId: string, vehicleId: string) { await this.vehicles.findOne(tenantId, vehicleId); return this.repository.listByVehicle(tenantId, vehicleId); }
}

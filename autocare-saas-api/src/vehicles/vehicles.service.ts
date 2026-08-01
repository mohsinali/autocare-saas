import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CustomersService } from '../customers/customers.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesRepository } from './repositories/vehicles.repository';

@Injectable()
export class VehiclesService {
  constructor(private readonly repository: VehiclesRepository, private readonly customers: CustomersService) {}

  async create(tenantId: string, dto: CreateVehicleDto) {
    await this.customers.findOne(tenantId, dto.customerId);
    try {
      return await this.repository.createWithNextCode({ ...dto, tenantId, registrationNumber: this.normalizeRegistration(dto.registrationNumber), vin: this.normalizeVin(dto.vin), purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined });
    } catch (error) { this.rethrowUniqueRegistration(error); }
  }

  async findAll(tenantId: string, query: ListVehiclesDto) {
    if (query.customerId) await this.customers.findOne(tenantId, query.customerId);
    const result = await this.repository.list(tenantId, query.page, query.limit, query.search, query.customerId);
    return { ...result, page: query.page, limit: query.limit, totalPages: Math.ceil(result.total / query.limit) };
  }

  async findOne(tenantId: string, id: string) {
    const vehicle = await this.repository.findById(tenantId, id);
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async update(tenantId: string, id: string, dto: UpdateVehicleDto) {
    await this.findOne(tenantId, id);
    if (dto.customerId) await this.customers.findOne(tenantId, dto.customerId);
    try {
      return await this.repository.update(id, { ...dto, ...(dto.registrationNumber ? { registrationNumber: this.normalizeRegistration(dto.registrationNumber) } : {}), ...(dto.vin !== undefined ? { vin: this.normalizeVin(dto.vin) } : {}), ...(dto.purchaseDate !== undefined ? { purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null } : {}) });
    } catch (error) { this.rethrowUniqueRegistration(error); }
  }

  async remove(tenantId: string, id: string) { await this.findOne(tenantId, id); return this.repository.softDelete(id); }

  private normalizeRegistration(value: string): string { return value.trim().toUpperCase(); }
  private normalizeVin(value?: string): string | undefined { return value?.trim().toUpperCase(); }
  private rethrowUniqueRegistration(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('A vehicle with this registration number already exists');
    throw error;
  }
}

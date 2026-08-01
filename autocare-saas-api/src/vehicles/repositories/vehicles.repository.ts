import { Injectable } from '@nestjs/common';
import { Prisma, Vehicle } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VehiclesRepository {
  constructor(private readonly prisma: PrismaService) {}
  async createWithNextCode(data: Omit<Prisma.VehicleUncheckedCreateInput, 'vehicleCode'>): Promise<Vehicle> {
    return this.prisma.$transaction(async (transaction) => {
      const sequence = await transaction.vehicleSequence.upsert({ where: { tenantId: data.tenantId }, create: { tenantId: data.tenantId, currentValue: 1 }, update: { currentValue: { increment: 1 } } });
      const vehicleCode = `VH-${String(sequence.currentValue).padStart(6, '0')}`;
      return transaction.vehicle.create({ data: { ...data, vehicleCode } });
    });
  }
  findById(tenantId: string, id: string): Promise<Vehicle | null> { return this.prisma.vehicle.findFirst({ where: { id, tenantId, deletedAt: null } }); }
  update(id: string, data: Prisma.VehicleUpdateInput): Promise<Vehicle> { return this.prisma.vehicle.update({ where: { id }, data }); }
  softDelete(id: string): Promise<Vehicle> { return this.prisma.vehicle.update({ where: { id }, data: { deletedAt: new Date() } }); }
  async list(tenantId: string, page: number, limit: number, search?: string, customerId?: string): Promise<{ data: Vehicle[]; total: number }> {
    const where: Prisma.VehicleWhereInput = { tenantId, deletedAt: null, ...(customerId ? { customerId } : {}), ...(search ? { OR: [{ registrationNumber: { contains: search, mode: 'insensitive' } }, { vehicleCode: { contains: search, mode: 'insensitive' } }, { make: { contains: search, mode: 'insensitive' } }, { model: { contains: search, mode: 'insensitive' } }, { vin: { contains: search, mode: 'insensitive' } }] } : {}) };
    const [data, total] = await this.prisma.$transaction([this.prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), this.prisma.vehicle.count({ where })]);
    return { data, total };
  }
}

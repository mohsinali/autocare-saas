import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, VehicleStatus, FuelType, Transmission } from '@prisma/client';
import { CustomersService } from '../customers/customers.service';
import { VehiclesRepository } from './repositories/vehicles.repository';
import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  const customer = { findOne: jest.fn() };
  const repository = { createWithNextCode: jest.fn(), findById: jest.fn(), list: jest.fn(), update: jest.fn(), softDelete: jest.fn() };
  const service = new VehiclesService(repository as unknown as VehiclesRepository, customer as unknown as CustomersService);
  const dto = { customerId: '2b5e41eb-4030-4f65-9c6d-e002757ceabc', registrationNumber: ' ab-123 ', make: 'Toyota', model: 'Corolla', year: 2024, fuelType: FuelType.PETROL, transmission: Transmission.AUTOMATIC, currentMileage: 0 };

  beforeEach(() => jest.clearAllMocks());
  it('validates the customer and normalizes identifiers before creating a vehicle', async () => {
    customer.findOne.mockResolvedValue({ id: dto.customerId }); repository.createWithNextCode.mockResolvedValue({ id: 'vehicle-id' });
    await service.create('tenant-id', dto);
    expect(customer.findOne).toHaveBeenCalledWith('tenant-id', dto.customerId);
    expect(repository.createWithNextCode).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-id', registrationNumber: 'AB-123' }));
  });
  it('does not expose a vehicle from a different tenant', async () => { repository.findById.mockResolvedValue(null); await expect(service.findOne('tenant-id', 'vehicle-id')).rejects.toThrow(NotFoundException); });
  it('soft-deletes only after tenant-scoped lookup', async () => { repository.findById.mockResolvedValue({ id: 'vehicle-id' }); repository.softDelete.mockResolvedValue({ id: 'vehicle-id', status: VehicleStatus.ACTIVE }); await service.remove('tenant-id', 'vehicle-id'); expect(repository.softDelete).toHaveBeenCalledWith('vehicle-id'); });
  it('maps registration uniqueness violations to a conflict response', async () => { customer.findOne.mockResolvedValue({ id: dto.customerId }); repository.createWithNextCode.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: 'test' })); await expect(service.create('tenant-id', dto)).rejects.toThrow(ConflictException); });
});

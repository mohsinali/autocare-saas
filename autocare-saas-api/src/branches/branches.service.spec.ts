import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BranchesRepository } from './repositories/branches.repository';
import { BranchesService } from './branches.service';

describe('BranchesService', () => {
  const repository = { create: jest.fn(), findById: jest.fn(), list: jest.fn(), update: jest.fn(), softDelete: jest.fn() };
  const service = new BranchesService(repository as unknown as BranchesRepository);
  const dto = { name: 'Downtown', phone: '+1 212 555 0100', addressLine1: '1 Main St', city: 'New York', stateProvince: 'NY', postalCode: '10001', country: 'US', timezone: 'America/New_York', businessOpeningTime: '09:00', businessClosingTime: '18:00' };

  beforeEach(() => jest.clearAllMocks());

  it('creates a tenant-scoped branch and converts business hours to database times', async () => {
    repository.create.mockResolvedValue({ id: 'branch-id' });
    await service.create('tenant-id', dto);
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-id', businessOpeningTime: new Date('1970-01-01T09:00:00.000Z'), businessClosingTime: new Date('1970-01-01T18:00:00.000Z') }));
  });

  it('rejects closing times that are not after opening times', async () => {
    await expect(service.create('tenant-id', { ...dto, businessClosingTime: '09:00' })).rejects.toThrow(BadRequestException);
  });

  it('does not expose a branch from a different tenant', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('tenant-id', 'branch-id')).rejects.toThrow(NotFoundException);
  });

  it('soft-deletes only after a tenant-scoped lookup', async () => {
    repository.findById.mockResolvedValue({ id: 'branch-id', isActive: true });
    await service.remove('tenant-id', 'branch-id');
    expect(repository.softDelete).toHaveBeenCalledWith('tenant-id', 'branch-id');
  });
});

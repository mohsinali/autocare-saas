import { CustomersService } from './customers.service';
describe('CustomersService', () => {
  it('returns a paginated tenant-scoped result', async () => {
    const repository = { list: jest.fn().mockResolvedValue({ data: [], total: 0 }) } as any;
    const service = new CustomersService(repository);
    await expect(service.findAll('tenant-id', { page: 1, limit: 20 })).resolves.toEqual({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
    expect(repository.list).toHaveBeenCalledWith('tenant-id', 1, 20, undefined);
  });
});

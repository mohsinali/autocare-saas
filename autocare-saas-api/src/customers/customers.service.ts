import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateCustomerDto } from './dto/create-customer.dto'; import { ListCustomersDto } from './dto/list-customers.dto'; import { UpdateCustomerDto } from './dto/update-customer.dto'; import { CustomersRepository } from './repositories/customers.repository';
@Injectable()
export class CustomersService {
  constructor(private readonly repository: CustomersRepository) {}
  async create(tenantId: string, dto: CreateCustomerDto) { try { return await this.repository.create({ ...dto, email: dto.email?.toLowerCase(), tenantId }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('A customer with this email already exists'); throw error; } }
  async findAll(tenantId: string, query: ListCustomersDto) { const result = await this.repository.list(tenantId, query.page, query.limit, query.search); return { ...result, page: query.page, limit: query.limit, totalPages: Math.ceil(result.total / query.limit) }; }
  async findOne(tenantId: string, id: string) { const customer = await this.repository.findById(tenantId, id); if (!customer) throw new NotFoundException('Customer not found'); return customer; }
  async update(tenantId: string, id: string, dto: UpdateCustomerDto) { await this.findOne(tenantId, id); try { return await this.repository.update(tenantId, id, { ...dto, ...(dto.email ? { email: dto.email.toLowerCase() } : {}) }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('A customer with this email already exists'); throw error; } }
}

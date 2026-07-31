import { Injectable } from '@nestjs/common';
import { Prisma, Customer } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}
  create(data: Prisma.CustomerUncheckedCreateInput): Promise<Customer> { return this.prisma.customer.create({ data }); }
  findById(tenantId: string, id: string): Promise<Customer | null> { return this.prisma.customer.findFirst({ where: { id, tenantId } }); }
  update(_tenantId: string, id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> { return this.prisma.customer.update({ where: { id }, data }); }
  async list(tenantId: string, page: number, limit: number, search?: string): Promise<{ data: Customer[]; total: number }> {
    const where: Prisma.CustomerWhereInput = { tenantId, ...(search ? { OR: [{ firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { phone: { contains: search, mode: 'insensitive' } }] } : {}) };
    const [data, total] = await this.prisma.$transaction([this.prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), this.prisma.customer.count({ where })]); return { data, total };
  }
}

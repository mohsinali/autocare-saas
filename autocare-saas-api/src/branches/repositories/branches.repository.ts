import { Injectable } from '@nestjs/common';
import { Branch, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BranchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.BranchUncheckedCreateInput): Promise<Branch> { return this.prisma.branch.create({ data }); }
  findById(tenantId: string, id: string): Promise<Branch | null> { return this.prisma.branch.findFirst({ where: { id, tenantId, deletedAt: null } }); }
  update(tenantId: string, id: string, data: Prisma.BranchUpdateInput): Promise<Branch> { return this.prisma.branch.update({ where: { id_tenantId: { id, tenantId } }, data }); }
  softDelete(tenantId: string, id: string): Promise<Branch> { return this.prisma.branch.update({ where: { id_tenantId: { id, tenantId } }, data: { deletedAt: new Date(), isActive: false } }); }

  async list(tenantId: string, page: number, limit: number, search?: string): Promise<{ data: Branch[]; total: number }> {
    const where: Prisma.BranchWhereInput = { tenantId, deletedAt: null, ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { city: { contains: search, mode: 'insensitive' } }, { phone: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {}) };
    const [data, total] = await this.prisma.$transaction([this.prisma.branch.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), this.prisma.branch.count({ where })]);
    return { data, total };
  }
}

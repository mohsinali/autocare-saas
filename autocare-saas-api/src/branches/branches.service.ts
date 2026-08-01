import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateBranchDto } from './dto/create-branch.dto';
import { ListBranchesDto } from './dto/list-branches.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchesRepository } from './repositories/branches.repository';

@Injectable()
export class BranchesService {
  constructor(private readonly repository: BranchesRepository) {}

  async create(tenantId: string, dto: CreateBranchDto) {
    this.assertBusinessHours(dto);
    return this.repository.create(this.toCreateData(tenantId, dto));
  }

  async findAll(tenantId: string, query: ListBranchesDto) {
    const result = await this.repository.list(tenantId, query.page, query.limit, query.search);
    return { ...result, page: query.page, limit: query.limit, totalPages: Math.ceil(result.total / query.limit) };
  }

  async findOne(tenantId: string, id: string) {
    const branch = await this.repository.findById(tenantId, id);
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async findActiveOne(tenantId: string, id: string) {
    const branch = await this.findOne(tenantId, id);
    if (!branch.isActive) throw new NotFoundException('Active branch not found');
    return branch;
  }

  async update(tenantId: string, id: string, dto: UpdateBranchDto) {
    const existing = await this.findOne(tenantId, id);
    this.assertBusinessHours({ businessOpeningTime: dto.businessOpeningTime ?? this.dateToTime(existing.businessOpeningTime), businessClosingTime: dto.businessClosingTime ?? this.dateToTime(existing.businessClosingTime) });
    return this.repository.update(tenantId, id, this.toUpdateData(dto));
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.repository.softDelete(tenantId, id);
  }

  private toCreateData(tenantId: string, dto: CreateBranchDto): Prisma.BranchUncheckedCreateInput {
    return this.toPersistenceData(tenantId, dto) as Prisma.BranchUncheckedCreateInput;
  }

  private toUpdateData(dto: UpdateBranchDto): Prisma.BranchUncheckedUpdateInput {
    return this.toPersistenceData(undefined, dto) as Prisma.BranchUncheckedUpdateInput;
  }

  private toPersistenceData(tenantId: string | undefined, dto: CreateBranchDto | UpdateBranchDto): Record<string, unknown> {
    const data = {
      ...dto,
      ...(tenantId ? { tenantId } : {}),
      ...(dto.email !== undefined ? { email: dto.email?.toLowerCase() } : {}),
      ...(dto.businessOpeningTime !== undefined ? { businessOpeningTime: this.timeToDate(dto.businessOpeningTime) } : {}),
      ...(dto.businessClosingTime !== undefined ? { businessClosingTime: this.timeToDate(dto.businessClosingTime) } : {}),
    };
    return data;
  }

  private timeToDate(value: string): Date { return new Date(`1970-01-01T${value}:00.000Z`); }
  private dateToTime(value: Date): string { return value.toISOString().slice(11, 16); }
  private assertBusinessHours(hours: { businessOpeningTime?: string; businessClosingTime?: string }): void {
    if (hours.businessOpeningTime && hours.businessClosingTime && hours.businessOpeningTime >= hours.businessClosingTime) throw new BadRequestException('businessClosingTime must be after businessOpeningTime');
  }
}

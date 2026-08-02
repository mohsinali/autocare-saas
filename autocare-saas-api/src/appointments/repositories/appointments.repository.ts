import { Injectable } from "@nestjs/common";
import { Appointment, AppointmentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface AppointmentListFilters {
  search?: string;
  branchId?: string;
  customerId?: string;
  vehicleId?: string;
  status?: AppointmentStatus;
  serviceType?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy: "appointmentDateTimeUtc" | "createdAt" | "updatedAt" | "status";
  sortOrder: "asc" | "desc";
}

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AppointmentUncheckedCreateInput): Promise<Appointment> {
    return this.prisma.appointment.create({ data });
  }
  findById(tenantId: string, id: string): Promise<Appointment | null> {
    return this.prisma.appointment.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }
  update(
    tenantId: string,
    id: string,
    data: Prisma.AppointmentUncheckedUpdateInput,
  ): Promise<Appointment> {
    return this.prisma.appointment.update({
      where: { id_tenantId: { id, tenantId } },
      data,
    });
  }
  softDelete(tenantId: string, id: string): Promise<Appointment> {
    return this.update(tenantId, id, { deletedAt: new Date() });
  }
  findConflict(
    tenantId: string,
    branchId: string,
    appointmentDateTimeUtc: Date,
    excludeId?: string,
  ): Promise<Appointment | null> {
    return this.prisma.appointment.findFirst({
      where: {
        tenantId,
        branchId,
        appointmentDateTimeUtc,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async list(
    tenantId: string,
    page: number,
    limit: number,
    filters: AppointmentListFilters,
  ): Promise<{ data: Appointment[]; total: number }> {
    const where = this.toWhere(tenantId, filters);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return { data, total };
  }

  calendar(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    branchId?: string,
  ): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(branchId ? { branchId } : {}),
        appointmentDateTimeUtc: { gte: startDate, lte: endDate },
      },
      orderBy: { appointmentDateTimeUtc: "asc" },
    });
  }

  private toWhere(
    tenantId: string,
    filters: AppointmentListFilters,
  ): Prisma.AppointmentWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.vehicleId ? { vehicleId: filters.vehicleId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.serviceType
        ? {
            serviceRequested: {
              contains: filters.serviceType,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.startDate || filters.endDate
        ? {
            appointmentDateTimeUtc: {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              {
                serviceRequested: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              { notes: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
  }
}

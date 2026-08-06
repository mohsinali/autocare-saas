import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Appointment,
  Prisma,
  ServiceHistory,
  ServiceHistoryStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export const serviceHistoryDetailInclude = {
  branch: { select: { id: true, name: true, timezone: true } },
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      customerId: true,
      vehicleCode: true,
      registrationNumber: true,
      make: true,
      model: true,
      year: true,
      currentMileage: true,
    },
  },
  appointment: {
    select: {
      id: true,
      appointmentDateTimeUtc: true,
      serviceRequested: true,
      status: true,
    },
  },
  creator: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  completer: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  canceller: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  lineItems: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
  },
} satisfies Prisma.ServiceHistoryInclude;

export type ServiceHistoryDetail = Prisma.ServiceHistoryGetPayload<{
  include: typeof serviceHistoryDetailInclude;
}>;

export interface ServiceHistoryListFilters {
  branchId?: string;
  customerId?: string;
  vehicleId?: string;
  appointmentId?: string;
  status?: ServiceHistoryStatus;
  visitDateFrom?: Date;
  visitDateTo?: Date;
  search?: string;
  sortBy: "visitDate" | "createdAt" | "updatedAt" | "status";
  sortOrder: "asc" | "desc";
}

@Injectable()
export class ServiceHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.ServiceHistoryUncheckedCreateInput,
  ): Promise<ServiceHistoryDetail> {
    return this.prisma.serviceHistory.create({
      data,
      include: serviceHistoryDetailInclude,
    });
  }

  findById(tenantId: string, id: string): Promise<ServiceHistoryDetail | null> {
    return this.prisma.serviceHistory.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: serviceHistoryDetailInclude,
    });
  }

  findAppointment(tenantId: string, id: string): Promise<Appointment | null> {
    return this.prisma.appointment.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  update(
    tenantId: string,
    id: string,
    data: Prisma.ServiceHistoryUncheckedUpdateInput,
  ): Promise<ServiceHistoryDetail> {
    return this.prisma.serviceHistory.update({
      where: { id_tenantId: { id, tenantId } },
      data,
      include: serviceHistoryDetailInclude,
    });
  }

  softDelete(tenantId: string, id: string): Promise<ServiceHistory> {
    return this.prisma.serviceHistory.update({
      where: { id_tenantId: { id, tenantId } },
      data: { deletedAt: new Date() },
    });
  }

  async list(
    tenantId: string,
    page: number,
    limit: number,
    filters: ServiceHistoryListFilters,
  ): Promise<{ data: ServiceHistoryDetail[]; total: number }> {
    const where: Prisma.ServiceHistoryWhereInput = {
      tenantId,
      deletedAt: null,
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.vehicleId ? { vehicleId: filters.vehicleId } : {}),
      ...(filters.appointmentId
        ? { appointmentId: filters.appointmentId }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.visitDateFrom || filters.visitDateTo
        ? {
            visitDate: {
              ...(filters.visitDateFrom ? { gte: filters.visitDateFrom } : {}),
              ...(filters.visitDateTo ? { lte: filters.visitDateTo } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              {
                initialRequest: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                customerComplaint: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              { diagnosis: { contains: filters.search, mode: "insensitive" } },
              {
                workSummary: { contains: filters.search, mode: "insensitive" },
              },
              {
                lineItems: {
                  some: {
                    deletedAt: null,
                    description: {
                      contains: filters.search,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.serviceHistory.findMany({
        where,
        include: serviceHistoryDetailInclude,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.serviceHistory.count({ where }),
    ]);
    return { data, total };
  }

  async complete(
    tenantId: string,
    id: string,
    userId: string,
    mileageAtService: number | undefined,
    workSummary?: string,
    recommendations?: string,
  ): Promise<ServiceHistoryDetail> {
    await this.prisma.$transaction(
      async (transaction) => {
        const history = await transaction.serviceHistory.findFirst({
          where: { id, tenantId, deletedAt: null },
          include: { vehicle: true },
        });
        if (!history) throw new NotFoundException("Service History not found");
        if (history.status !== ServiceHistoryStatus.DRAFT)
          throw new BadRequestException(
            "Only draft Service History records may be completed",
          );
        if (!history.vehicle)
          throw new BadRequestException(
            "A vehicle must be assigned before completion",
          );
        const mileage = mileageAtService ?? history.mileageAtService;
        if (mileage === null || mileage === undefined)
          throw new BadRequestException(
            "Mileage is required before completion",
          );
        if (mileage < history.vehicle.currentMileage)
          throw new ConflictException(
            "Mileage cannot be lower than the vehicle current mileage",
          );
        const completed = await transaction.serviceHistory.updateMany({
          where: {
            id,
            tenantId,
            status: ServiceHistoryStatus.DRAFT,
            deletedAt: null,
          },
          data: {
            status: ServiceHistoryStatus.COMPLETED,
            mileageAtService: mileage,
            completedAt: new Date(),
            completedBy: userId,
            ...(workSummary !== undefined
              ? { workSummary: workSummary.trim() || null }
              : {}),
            ...(recommendations !== undefined
              ? { recommendations: recommendations.trim() || null }
              : {}),
          },
        });
        if (completed.count !== 1)
          throw new ConflictException(
            "Service History status changed before completion",
          );
        const vehicle = await transaction.vehicle.updateMany({
          where: {
            id: history.vehicle.id,
            tenantId,
            deletedAt: null,
            currentMileage: { lte: mileage },
          },
          data: { currentMileage: mileage, lastServiceMileage: mileage },
        });
        if (vehicle.count !== 1)
          throw new ConflictException("Vehicle mileage could not be updated");
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    const completed = await this.findById(tenantId, id);
    if (!completed) throw new NotFoundException("Service History not found");
    return completed;
  }

  async cancel(
    tenantId: string,
    id: string,
    userId: string,
    reason?: string,
  ): Promise<ServiceHistoryDetail> {
    await this.prisma.$transaction(
      async (transaction) => {
        const history = await transaction.serviceHistory.findFirst({
          where: { id, tenantId, deletedAt: null },
        });
        if (!history) throw new NotFoundException("Service History not found");
        if (history.status !== ServiceHistoryStatus.DRAFT)
          throw new BadRequestException(
            "Only draft Service History records may be cancelled",
          );
        const lineItems = await transaction.serviceLineItem.count({
          where: { tenantId, serviceHistoryId: id, deletedAt: null },
        });
        if (lineItems > 0)
          throw new ConflictException(
            "A Service History with line items cannot be cancelled",
          );
        await transaction.serviceHistory.update({
          where: { id_tenantId: { id, tenantId } },
          data: {
            status: ServiceHistoryStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledBy: userId,
            cancellationReason: reason?.trim() || null,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    const cancelled = await this.findById(tenantId, id);
    if (!cancelled) throw new NotFoundException("Service History not found");
    return cancelled;
  }
}

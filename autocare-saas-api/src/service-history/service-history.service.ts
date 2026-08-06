import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ServiceHistoryStatus } from "@prisma/client";
import { BranchesService } from "../branches/branches.service";
import { CustomersService } from "../customers/customers.service";
import { TimezoneService } from "../timezone/timezone.service";
import { VehiclesService } from "../vehicles/vehicles.service";
import { CancelServiceHistoryDto } from "./dto/cancel-service-history.dto";
import { CompleteServiceHistoryDto } from "./dto/complete-service-history.dto";
import { CreateServiceHistoryDto } from "./dto/create-service-history.dto";
import { ListServiceHistoryDto } from "./dto/list-service-history.dto";
import { UpdateServiceHistoryDto } from "./dto/update-service-history.dto";
import { ServiceHistoryRepository } from "./repositories/service-history.repository";
import {
  mapServiceHistory,
  ServiceHistoryResponse,
} from "./service-history.mapper";

@Injectable()
export class ServiceHistoryService {
  constructor(
    private readonly repository: ServiceHistoryRepository,
    private readonly vehicles: VehiclesService,
    private readonly customers: CustomersService,
    private readonly branches: BranchesService,
    private readonly timezone: TimezoneService,
  ) {}

  async create(
    tenantId: string,
    createdBy: string,
    dto: CreateServiceHistoryDto,
  ): Promise<ServiceHistoryResponse> {
    const [branch, customer, vehicle] = await Promise.all([
      this.branches.findActiveOne(tenantId, dto.branchId),
      this.customers.findOne(tenantId, dto.customerId),
      this.vehicles.findOne(tenantId, dto.vehicleId),
    ]);
    if (vehicle.customerId !== customer.id)
      throw new BadRequestException(
        "Vehicle does not belong to the selected customer",
      );
    if (dto.appointmentId)
      await this.assertAppointment(
        tenantId,
        dto.appointmentId,
        branch.id,
        customer.id,
        vehicle.id,
      );
    const history = await this.persist(
      this.repository.create({
        tenantId,
        branchId: branch.id,
        customerId: customer.id,
        vehicleId: vehicle.id,
        appointmentId: dto.appointmentId,
        status: ServiceHistoryStatus.DRAFT,
        visitDate: this.timezone.convertLocalToUtc(
          dto.visitDate,
          branch.timezone,
        ),
        mileageAtService: dto.mileageAtService,
        customerComplaint: this.optionalText(dto.customerComplaint),
        initialRequest: dto.initialRequest.trim(),
        diagnosis: this.optionalText(dto.diagnosis),
        workSummary: this.optionalText(dto.workSummary),
        recommendations: this.optionalText(dto.recommendations),
        internalNotes: this.optionalText(dto.internalNotes),
        createdBy,
        ...(dto.lineItems?.length
          ? {
              lineItems: {
                create: dto.lineItems.map((item, index) => ({
                  tenantId,
                  type: item.type,
                  description: item.description.trim(),
                  quantity: new Prisma.Decimal(item.quantity),
                  unitPrice: new Prisma.Decimal(item.unitPrice),
                  notes: this.optionalText(item.notes),
                  sortOrder: item.sortOrder ?? index,
                })),
              },
            }
          : {}),
      }),
    );
    return mapServiceHistory(history);
  }

  async findAll(tenantId: string, query: ListServiceHistoryDto) {
    if (
      query.visitDateFrom &&
      query.visitDateTo &&
      new Date(query.visitDateFrom) > new Date(query.visitDateTo)
    )
      throw new BadRequestException(
        "visitDateFrom must be before or equal to visitDateTo",
      );
    const result = await this.repository.list(
      tenantId,
      query.page,
      query.limit,
      {
        branchId: query.branchId,
        customerId: query.customerId,
        vehicleId: query.vehicleId,
        appointmentId: query.appointmentId,
        status: query.status,
        visitDateFrom: query.visitDateFrom
          ? new Date(query.visitDateFrom)
          : undefined,
        visitDateTo: query.visitDateTo
          ? new Date(query.visitDateTo)
          : undefined,
        search: query.search?.trim() || undefined,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    );
    return {
      data: result.data.map(mapServiceHistory),
      total: result.total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(result.total / query.limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<ServiceHistoryResponse> {
    const history = await this.repository.findById(tenantId, id);
    if (!history) throw new NotFoundException("Service History not found");
    return mapServiceHistory(history);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateServiceHistoryDto,
  ): Promise<ServiceHistoryResponse> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) throw new NotFoundException("Service History not found");
    this.assertDraft(existing.status);
    const branchId = dto.branchId ?? existing.branchId;
    const customerId = dto.customerId ?? existing.customerId;
    const vehicleId = dto.vehicleId ?? existing.vehicleId;
    if (!vehicleId) throw new BadRequestException("A vehicle must be assigned");
    const [branch, customer, vehicle] = await Promise.all([
      this.branches.findActiveOne(tenantId, branchId),
      this.customers.findOne(tenantId, customerId),
      this.vehicles.findOne(tenantId, vehicleId),
    ]);
    if (vehicle.customerId !== customer.id)
      throw new BadRequestException(
        "Vehicle does not belong to the selected customer",
      );
    const appointmentId =
      dto.appointmentId === undefined
        ? existing.appointmentId
        : dto.appointmentId;
    if (appointmentId)
      await this.assertAppointment(
        tenantId,
        appointmentId,
        branch.id,
        customer.id,
        vehicle.id,
      );
    const updated = await this.persist(
      this.repository.update(tenantId, id, {
        branchId: branch.id,
        customerId: customer.id,
        vehicleId: vehicle.id,
        ...(dto.appointmentId !== undefined
          ? { appointmentId: dto.appointmentId }
          : {}),
        ...(dto.visitDate
          ? {
              visitDate: this.timezone.convertLocalToUtc(
                dto.visitDate,
                branch.timezone,
              ),
            }
          : {}),
        ...(dto.mileageAtService !== undefined
          ? { mileageAtService: dto.mileageAtService }
          : {}),
        ...(dto.customerComplaint !== undefined
          ? { customerComplaint: this.optionalText(dto.customerComplaint) }
          : {}),
        ...(dto.initialRequest !== undefined
          ? { initialRequest: dto.initialRequest.trim() }
          : {}),
        ...(dto.diagnosis !== undefined
          ? { diagnosis: this.optionalText(dto.diagnosis) }
          : {}),
        ...(dto.workSummary !== undefined
          ? { workSummary: this.optionalText(dto.workSummary) }
          : {}),
        ...(dto.recommendations !== undefined
          ? { recommendations: this.optionalText(dto.recommendations) }
          : {}),
        ...(dto.internalNotes !== undefined
          ? { internalNotes: this.optionalText(dto.internalNotes) }
          : {}),
      }),
    );
    return mapServiceHistory(updated);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const history = await this.repository.findById(tenantId, id);
    if (!history) throw new NotFoundException("Service History not found");
    this.assertDraft(history.status);
    await this.repository.softDelete(tenantId, id);
  }

  async complete(
    tenantId: string,
    id: string,
    userId: string,
    dto: CompleteServiceHistoryDto,
  ): Promise<ServiceHistoryResponse> {
    return mapServiceHistory(
      await this.repository.complete(
        tenantId,
        id,
        userId,
        dto.mileageAtService,
        dto.workSummary,
        dto.recommendations,
      ),
    );
  }

  async cancel(
    tenantId: string,
    id: string,
    userId: string,
    dto: CancelServiceHistoryDto,
  ): Promise<ServiceHistoryResponse> {
    return mapServiceHistory(
      await this.repository.cancel(tenantId, id, userId, dto.reason),
    );
  }

  private async assertAppointment(
    tenantId: string,
    appointmentId: string,
    branchId: string,
    customerId: string,
    vehicleId: string,
  ): Promise<void> {
    const appointment = await this.repository.findAppointment(
      tenantId,
      appointmentId,
    );
    if (!appointment) throw new NotFoundException("Appointment not found");
    if (
      appointment.branchId !== branchId ||
      appointment.customerId !== customerId ||
      appointment.vehicleId !== vehicleId
    )
      throw new BadRequestException(
        "Appointment does not match the selected branch, customer, and vehicle",
      );
  }

  private assertDraft(status: ServiceHistoryStatus): void {
    if (status !== ServiceHistoryStatus.DRAFT)
      throw new BadRequestException(
        "Only draft Service History records may be edited",
      );
  }

  private optionalText(value?: string | null): string | null | undefined {
    return value === undefined ? undefined : value?.trim() || null;
  }

  private async persist<T>(operation: Promise<T>): Promise<T> {
    try {
      return await operation;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ConflictException(
          "The selected appointment is already linked to Service History",
        );
      throw error;
    }
  }
}

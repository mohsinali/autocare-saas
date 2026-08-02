import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Appointment, AppointmentStatus, Branch, Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { BranchesService } from "../branches/branches.service";
import { TimezoneService } from "../timezone/timezone.service";
import { VehiclesService } from "../vehicles/vehicles.service";
import { AppointmentCalendarDto } from "./dto/appointment-calendar.dto";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { ListAppointmentsDto } from "./dto/list-appointments.dto";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto";
import { UpdateAppointmentStatusDto } from "./dto/update-appointment-status.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import {
  AppointmentListFilters,
  AppointmentsRepository,
} from "./repositories/appointments.repository";

const STATUS_TRANSITIONS: Readonly<
  Record<AppointmentStatus, readonly AppointmentStatus[]>
> = {
  SCHEDULED: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  CONFIRMED: [
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  CHECKED_IN: [AppointmentStatus.IN_SERVICE, AppointmentStatus.CANCELLED],
  IN_SERVICE: [AppointmentStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly vehicles: VehiclesService,
    private readonly branches: BranchesService,
    private readonly timezone: TimezoneService,
  ) {}

  async create(
    tenantId: string,
    createdBy: string,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const [vehicle, branch] = await Promise.all([
      this.vehicles.findOne(tenantId, dto.vehicleId),
      this.branches.findActiveOne(tenantId, dto.branchId),
    ]);
    const appointmentDateTimeUtc = this.toValidUtcDate(
      dto.appointmentDateTime,
      branch,
      dto.estimatedDurationMinutes,
    );
    await this.assertNoConflict(tenantId, branch.id, appointmentDateTimeUtc);
    try {
      return await this.repository.create({
        tenantId,
        branchId: branch.id,
        customerId: vehicle.customerId,
        vehicleId: vehicle.id,
        appointmentDateTimeUtc,
        estimatedDurationMinutes: dto.estimatedDurationMinutes,
        serviceRequested: dto.serviceRequested.trim(),
        notes: dto.notes?.trim(),
        createdBy,
      });
    } catch (error) {
      this.rethrowAppointmentConflict(error);
    }
  }

  async findAll(
    tenantId: string,
    query: ListAppointmentsDto,
  ): Promise<{
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.assertDateRange(query.startDate, query.endDate);
    const filters = this.toListFilters(query);
    const result = await this.repository.list(
      tenantId,
      query.page,
      query.limit,
      filters,
    );
    return {
      ...result,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(result.total / query.limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<Appointment> {
    const appointment = await this.repository.findById(tenantId, id);
    if (!appointment) throw new NotFoundException("Appointment not found");
    return appointment;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(tenantId, id);
    this.assertModifiable(appointment);
    return this.repository.update(tenantId, id, {
      ...(dto.estimatedDurationMinutes !== undefined
        ? { estimatedDurationMinutes: dto.estimatedDurationMinutes }
        : {}),
      ...(dto.serviceRequested !== undefined
        ? { serviceRequested: dto.serviceRequested.trim() }
        : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes?.trim() ?? null } : {}),
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const appointment = await this.findOne(tenantId, id);
    this.assertModifiable(appointment);
    await this.repository.softDelete(tenantId, id);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    dto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(tenantId, id);
    if (!STATUS_TRANSITIONS[appointment.status].includes(dto.status))
      throw new BadRequestException(
        `Cannot transition appointment from ${appointment.status} to ${dto.status}`,
      );
    return this.repository.update(tenantId, id, { status: dto.status });
  }

  async reschedule(
    tenantId: string,
    id: string,
    dto: RescheduleAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(tenantId, id);
    this.assertModifiable(appointment);
    const branch = await this.branches.findActiveOne(
      tenantId,
      appointment.branchId,
    );
    const appointmentDateTimeUtc = this.toValidUtcDate(
      dto.appointmentDateTime,
      branch,
      appointment.estimatedDurationMinutes,
    );
    await this.assertNoConflict(
      tenantId,
      branch.id,
      appointmentDateTimeUtc,
      appointment.id,
    );
    try {
      return await this.repository.update(tenantId, id, {
        appointmentDateTimeUtc,
      });
    } catch (error) {
      this.rethrowAppointmentConflict(error);
    }
  }

  async calendar(
    tenantId: string,
    query: AppointmentCalendarDto,
  ): Promise<Appointment[]> {
    this.assertDateRange(query.startDate, query.endDate);
    if (query.branchId) await this.branches.findOne(tenantId, query.branchId);
    return this.repository.calendar(
      tenantId,
      new Date(query.startDate),
      new Date(query.endDate),
      query.branchId,
    );
  }

  private toValidUtcDate(
    localDateTime: string,
    branch: Branch,
    durationMinutes: number,
  ): Date {
    const appointmentDateTimeUtc = this.timezone.convertLocalToUtc(
      localDateTime,
      branch.timezone,
    );
    if (appointmentDateTimeUtc.getTime() <= Date.now())
      throw new BadRequestException(
        "Appointment must be scheduled in the future",
      );
    this.assertWithinBusinessHours(
      appointmentDateTimeUtc,
      branch,
      durationMinutes,
    );
    return appointmentDateTimeUtc;
  }

  private assertWithinBusinessHours(
    utcDate: Date,
    branch: Branch,
    durationMinutes: number,
  ): void {
    const localStart = DateTime.fromJSDate(utcDate, { zone: "utc" }).setZone(
      branch.timezone,
    );
    const localEnd = localStart.plus({ minutes: durationMinutes });
    const startTime = localStart.toFormat("HH:mm:ss");
    const endTime = localEnd.toFormat("HH:mm:ss");
    const opening = branch.businessOpeningTime.toISOString().slice(11, 19);
    const closing = branch.businessClosingTime.toISOString().slice(11, 19);
    if (
      localStart.toISODate() !== localEnd.toISODate() ||
      startTime < opening ||
      endTime > closing
    )
      throw new BadRequestException(
        "Appointment must fall within branch business hours",
      );
  }

  private async assertNoConflict(
    tenantId: string,
    branchId: string,
    appointmentDateTimeUtc: Date,
    excludeId?: string,
  ): Promise<void> {
    if (
      await this.repository.findConflict(
        tenantId,
        branchId,
        appointmentDateTimeUtc,
        excludeId,
      )
    )
      throw new ConflictException(
        "An appointment already exists for this branch at the selected date and time",
      );
  }

  private assertModifiable(appointment: Appointment): void {
    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    )
      throw new BadRequestException(
        `${appointment.status} appointments cannot be modified`,
      );
  }
  private assertDateRange(startDate?: string, endDate?: string): void {
    if (startDate && endDate && new Date(startDate) > new Date(endDate))
      throw new BadRequestException(
        "startDate must be before or equal to endDate",
      );
  }
  private toListFilters(query: ListAppointmentsDto): AppointmentListFilters {
    const now = new Date();
    const dayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const tomorrowStart = new Date(dayStart.getTime() + 86_400_000);
    const afterTomorrowStart = new Date(tomorrowStart.getTime() + 86_400_000);
    const dateRange = query.today
      ? { startDate: dayStart, endDate: new Date(tomorrowStart.getTime() - 1) }
      : query.tomorrow
        ? {
            startDate: tomorrowStart,
            endDate: new Date(afterTomorrowStart.getTime() - 1),
          }
        : query.upcoming
          ? { startDate: now }
          : {
              startDate: query.startDate
                ? new Date(query.startDate)
                : undefined,
              endDate: query.endDate ? new Date(query.endDate) : undefined,
            };
    return {
      search: query.search,
      branchId: query.branchId,
      customerId: query.customerId,
      vehicleId: query.vehicleId,
      status: query.status,
      serviceType: query.serviceType,
      ...dateRange,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };
  }
  private rethrowAppointmentConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      throw new ConflictException(
        "An appointment already exists for this branch at the selected date and time",
      );
    throw error;
  }
}

import { BadRequestException, ConflictException } from "@nestjs/common";
import {
  Appointment,
  AppointmentStatus,
  Branch,
  Vehicle,
} from "@prisma/client";
import { DateTime } from "luxon";
import { AppointmentsService } from "./appointments.service";
import { TimezoneService } from "../timezone/timezone.service";

const tenantId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const branchId = "33333333-3333-4333-8333-333333333333";
const vehicleId = "44444444-4444-4444-8444-444444444444";
const customerId = "55555555-5555-4555-8555-555555555555";

describe("AppointmentsService", () => {
  const branch = {
    id: branchId,
    timezone: "Asia/Karachi",
    businessOpeningTime: new Date("1970-01-01T09:00:00.000Z"),
    businessClosingTime: new Date("1970-01-01T18:00:00.000Z"),
    isActive: true,
  } as Branch;
  const vehicle = { id: vehicleId, customerId } as Vehicle;
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findConflict: jest.fn(),
    list: jest.fn(),
    calendar: jest.fn(),
  };
  const vehicles = { findOne: jest.fn() };
  const branches = {
    findActiveOne: jest.fn(),
    findOne: jest.fn(),
    findTimezones: jest.fn(),
  };
  const timezoneService = new TimezoneService();
  const timezone = {
    convertLocalToUtc: jest.fn((value: string, zone: string) =>
      DateTime.fromISO(value, { zone }).toUTC().toJSDate(),
    ),
    convertUtcToLocal: jest.fn(),
    localDayUtcRange: jest.fn(
      (zone: string, dayOffset: number, now: Date) =>
        timezoneService.localDayUtcRange(zone, dayOffset, now),
    ),
  };
  const service = new AppointmentsService(
    repository as never,
    vehicles as never,
    branches as never,
    timezone as never,
  );

  function localFutureAt(hour: number): string {
    return DateTime.now()
      .setZone("Asia/Karachi")
      .plus({ days: 2 })
      .startOf("day")
      .set({ hour, minute: 0, second: 0 })
      .toFormat("yyyy-LL-dd'T'HH:mm:ss");
  }
  function appointment(
    status: AppointmentStatus = AppointmentStatus.SCHEDULED,
  ): Appointment {
    return {
      id: "66666666-6666-4666-8666-666666666666",
      tenantId,
      branchId,
      customerId,
      vehicleId,
      appointmentDateTimeUtc: new Date("2030-01-01T05:00:00.000Z"),
      estimatedDurationMinutes: 60,
      serviceRequested: "Oil change",
      status,
      notes: null,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    vehicles.findOne.mockResolvedValue(vehicle);
    branches.findActiveOne.mockResolvedValue(branch);
    branches.findTimezones.mockResolvedValue([
      { id: branchId, timezone: branch.timezone },
    ]);
    repository.findConflict.mockResolvedValue(null);
    repository.create.mockResolvedValue(appointment());
    repository.update.mockResolvedValue(appointment());
  });

  it("rejects appointments that are not in the future", async () => {
    await expect(
      service.create(tenantId, userId, {
        branchId,
        vehicleId,
        appointmentDateTime: "2020-01-01T10:00:00",
        estimatedDurationMinutes: 60,
        serviceRequested: "Oil change",
      }),
    ).rejects.toThrow("future");
  });

  it("rejects appointments outside branch business hours", async () => {
    await expect(
      service.create(tenantId, userId, {
        branchId,
        vehicleId,
        appointmentDateTime: localFutureAt(8),
        estimatedDurationMinutes: 60,
        serviceRequested: "Oil change",
      }),
    ).rejects.toThrow("business hours");
  });

  it("rejects duplicate branch time slots", async () => {
    repository.findConflict.mockResolvedValue(appointment());
    await expect(
      service.create(tenantId, userId, {
        branchId,
        vehicleId,
        appointmentDateTime: localFutureAt(10),
        estimatedDurationMinutes: 60,
        serviceRequested: "Oil change",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("enforces the permitted status transition sequence", async () => {
    repository.findById.mockResolvedValue(
      appointment(AppointmentStatus.SCHEDULED),
    );
    await expect(
      service.updateStatus(tenantId, appointment().id, {
        status: AppointmentStatus.CHECKED_IN,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await service.updateStatus(tenantId, appointment().id, {
      status: AppointmentStatus.CONFIRMED,
    });
    expect(repository.update).toHaveBeenCalledWith(tenantId, appointment().id, {
      status: AppointmentStatus.CONFIRMED,
    });
  });

  it("reschedules a modifiable appointment after validating the new slot", async () => {
    const existing = appointment(AppointmentStatus.CONFIRMED);
    repository.findById.mockResolvedValue(existing);
    await service.reschedule(tenantId, existing.id, {
      appointmentDateTime: localFutureAt(11),
    });
    expect(repository.findConflict).toHaveBeenCalledWith(
      tenantId,
      branchId,
      expect.any(Date),
      existing.id,
    );
    expect(repository.update).toHaveBeenCalledWith(tenantId, existing.id, {
      appointmentDateTimeUtc: expect.any(Date),
    });
  });

  it("filters today using each branch's local calendar-day UTC boundaries", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-06T07:00:00.000Z"));
    const newYorkBranchId = "77777777-7777-4777-8777-777777777777";
    branches.findTimezones.mockResolvedValue([
      { id: branchId, timezone: "Asia/Karachi" },
      { id: newYorkBranchId, timezone: "America/New_York" },
    ]);
    const records = [
      { ...appointment(), id: "before", appointmentDateTimeUtc: new Date("2026-08-05T18:59:59.999Z") },
      { ...appointment(), id: "early", appointmentDateTimeUtc: new Date("2026-08-06T06:30:00.000Z") },
      { ...appointment(), id: "later", appointmentDateTimeUtc: new Date("2026-08-06T11:00:00.000Z") },
      { ...appointment(), id: "after", appointmentDateTimeUtc: new Date("2026-08-06T19:00:00.000Z") },
      { ...appointment(), id: "other-zone", branchId: newYorkBranchId, appointmentDateTimeUtc: new Date("2026-08-06T16:00:00.000Z") },
    ];
    repository.list.mockImplementation(
      async (_tenant: string, _page: number, _limit: number, filters: { branchDateRanges: { branchId: string; startDate: Date; endDate: Date }[] }) => {
        const data = records.filter((record) =>
          filters.branchDateRanges.some(
            (range) =>
              range.branchId === record.branchId &&
              record.appointmentDateTimeUtc >= range.startDate &&
              record.appointmentDateTimeUtc <= range.endDate,
          ),
        );
        return { data, total: data.length };
      },
    );

    const result = await service.findAll(tenantId, {
      page: 1,
      limit: 10,
      today: true,
      sortBy: "appointmentDateTimeUtc",
      sortOrder: "asc",
    });

    expect(result.data.map((item) => item.id)).toEqual([
      "early",
      "later",
      "other-zone",
    ]);
    expect(repository.list.mock.calls[0][3].branchDateRanges).toEqual([
      {
        branchId,
        startDate: new Date("2026-08-05T19:00:00.000Z"),
        endDate: new Date("2026-08-06T18:59:59.999Z"),
      },
      {
        branchId: newYorkBranchId,
        startDate: new Date("2026-08-06T04:00:00.000Z"),
        endDate: new Date("2026-08-07T03:59:59.999Z"),
      },
    ]);
    jest.useRealTimers();
  });
});

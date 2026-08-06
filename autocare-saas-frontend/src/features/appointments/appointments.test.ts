import { describe, expect, it, vi } from "vitest";
import { appointmentFormSchema } from "./appointment-schema";
import {
  branchDayUtcRange,
  branchLocalToApi,
  formatAppointmentDateTime,
  safeBranchTimezone,
  utcToBranchFormValues,
} from "./appointment-date-utils";
import { appointmentKeys } from "./appointment-query-keys";
import { APPOINTMENT_STATUS } from "./appointment-status";
import {
  appointmentsService,
  normalizeAppointmentFilters,
} from "../../services/api/appointments.service";

describe("appointment form", () => {
  it("rejects missing selections and invalid duration", () => {
    const result = appointmentFormSchema.safeParse({
      branchId: "",
      customerId: "",
      vehicleId: "",
      date: "",
      time: "",
      estimatedDurationMinutes: 0,
      serviceRequested: "",
      notes: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("branch timezone conversion", () => {
  it("round-trips branch-local values without browser time", () => {
    expect(branchLocalToApi("2026-11-02", "09:30", "America/New_York")).toBe(
      "2026-11-02T09:30:00",
    );
    expect(
      utcToBranchFormValues("2026-11-02T14:30:00.000Z", "America/New_York"),
    ).toEqual({ date: "2026-11-02", time: "09:30" });
    expect(
      formatAppointmentDateTime("2026-11-02T14:30:00.000Z", "America/New_York"),
    ).toContain("9:30");
  });
  it("creates UTC ranges across daylight-saving offsets", () => {
    expect(branchDayUtcRange("2026-03-08", "America/New_York")).toEqual({
      startDate: "2026-03-08T05:00:00.000Z",
      endDate: "2026-03-09T03:59:59.999Z",
    });
  });
  it("falls back safely for invalid route dates and branch timezones", () => {
    expect(safeBranchTimezone("not/a-timezone")).toBe("UTC");
    const range = branchDayUtcRange("", "not/a-timezone");
    expect(Date.parse(range.startDate)).not.toBeNaN();
    expect(Date.parse(range.endDate)).not.toBeNaN();
  });
});

describe("status actions and query keys", () => {
  it("loads dashboard appointments when used as an unbound query function", async () => {
    const response = { data: [], total: 0, page: 1, limit: 5, totalPages: 0 };
    const list = vi.spyOn(appointmentsService, "list").mockResolvedValue(response);
    const queryFn = appointmentsService.listToday;

    await expect(queryFn()).resolves.toEqual(response);
    expect(list).toHaveBeenCalledWith({ page: 1, limit: 5, today: true });
    list.mockRestore();
  });

  it("matches backend transition rules", () => {
    expect(
      APPOINTMENT_STATUS.SCHEDULED.actions.map((action) => action.status),
    ).toEqual(["CONFIRMED", "CANCELLED"]);
    expect(APPOINTMENT_STATUS.COMPLETED.actions).toEqual([]);
  });
  it("keeps filter-specific query keys stable", () => {
    const filters = { page: 1, limit: 20, branchId: "branch" };
    expect(appointmentKeys.list(filters)).toEqual([
      "appointments",
      "list",
      1,
      20,
      undefined,
      "branch",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("omits empty, false, and invalid list filters", () => {
    expect(
      normalizeAppointmentFilters({
        page: 0,
        limit: 10,
        branchId: "",
        customerId: "  ",
        vehicleId: "",
        search: " ",
        startDate: "invalid",
        endDate: "",
        today: false,
        tomorrow: false,
        upcoming: false,
      }),
    ).toEqual({ page: 1, limit: 10 });
  });

  it("preserves meaningful supported list filters", () => {
    expect(
      normalizeAppointmentFilters({
        page: 2,
        limit: 20,
        customerId: "customer-id",
        status: "CONFIRMED",
        serviceType: " brakes ",
        startDate: "2026-08-05T00:00:00.000Z",
        upcoming: true,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    ).toEqual({
      page: 2,
      limit: 20,
      customerId: "customer-id",
      status: "CONFIRMED",
      serviceType: "brakes",
      startDate: "2026-08-05T00:00:00.000Z",
      upcoming: true,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  });
});

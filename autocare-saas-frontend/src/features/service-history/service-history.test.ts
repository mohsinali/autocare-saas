import { describe, expect, it } from "vitest";
import {
  completionSchema,
  lineItemSchema,
  serviceHistorySchema,
} from "./service-history-schema";
import {
  serviceHistoryInvalidationKeys,
  serviceHistoryKeys,
} from "./service-history-query-keys";
import {
  canCancelServiceHistory,
  canEditServiceHistory,
} from "./service-history-status";

const validHistory = {
  branchId: "11111111-1111-4111-8111-111111111111",
  customerId: "22222222-2222-4222-8222-222222222222",
  vehicleId: "33333333-3333-4333-8333-333333333333",
  appointmentId: "",
  date: "2026-08-06",
  time: "11:30",
  mileageAtService: "",
  initialRequest: "Oil change",
  customerComplaint: "",
  diagnosis: "",
  workSummary: "",
  recommendations: "",
  internalNotes: "",
};

describe("Service History schemas", () => {
  it("allows optional draft mileage and rejects invalid ownership or text", () => {
    expect(serviceHistorySchema.safeParse(validHistory).success).toBe(true);
    expect(
      serviceHistorySchema.safeParse({
        ...validHistory,
        vehicleId: "",
        initialRequest: "",
      }).success,
    ).toBe(false);
  });
  it("preserves decimal strings and rejects unsafe line-item values", () => {
    expect(
      lineItemSchema.parse({
        type: "LABOR",
        description: "Labor",
        quantity: "1.125",
        unitPrice: "49.99",
        notes: "",
      }),
    ).toEqual(
      expect.objectContaining({ quantity: "1.125", unitPrice: "49.99" }),
    );
    expect(
      lineItemSchema.safeParse({
        type: "PART",
        description: "Part",
        quantity: "0",
        unitPrice: "1",
      }).success,
    ).toBe(false);
    expect(
      lineItemSchema.safeParse({
        type: "PART",
        description: "Part",
        quantity: "1",
        unitPrice: "-0.01",
      }).success,
    ).toBe(false);
  });
  it("requires non-negative completion mileage", () => {
    expect(completionSchema.safeParse({ mileageAtService: 100 }).success).toBe(
      true,
    );
    expect(completionSchema.safeParse({ mileageAtService: -1 }).success).toBe(
      false,
    );
  });
});

describe("Service History status and cache behavior", () => {
  it("keeps only drafts editable and prevents cancellation with line items", () => {
    expect(canEditServiceHistory("DRAFT")).toBe(true);
    expect(canEditServiceHistory("COMPLETED")).toBe(false);
    expect(canEditServiceHistory("CANCELLED")).toBe(false);
    expect(canCancelServiceHistory("DRAFT", 0)).toBe(true);
    expect(canCancelServiceHistory("DRAFT", 1)).toBe(false);
  });
  it("uses server filters for scoped lists", () => {
    const filters = {
      page: 1,
      limit: 5,
      customerId: "customer",
      vehicleId: "vehicle",
      status: "DRAFT" as const,
    };
    expect(serviceHistoryKeys.list(filters)).toEqual([
      "service-history",
      "list",
      filters,
    ]);
  });
  it("refreshes parent totals and vehicle mileage after completion", () => {
    expect(serviceHistoryInvalidationKeys("history", true)).toContainEqual([
      "service-history",
      "detail",
      "history",
      "line-items",
    ]);
    expect(serviceHistoryInvalidationKeys("history", true)).toContainEqual([
      "vehicles",
    ]);
  });
});

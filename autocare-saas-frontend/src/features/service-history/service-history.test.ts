import axios from "axios";
import { describe, expect, it, vi } from "vitest";
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
import {
  createServiceHistoryWithInitialLineItem,
  initialLineItemsForPayload,
  InitialLineItemCreationError,
} from "./service-history-create";
import { serviceHistoryErrorMessage } from "./service-history-error";
import {
  formatServiceHistorySubtotal,
  formatServiceLineItemAmounts,
} from "./service-history-currency";
import {
  DEFAULT_CURRENCY_CODE,
  formatCurrency,
  INVALID_CURRENCY_VALUE,
} from "../../lib/currency";
import { QueryClient } from "@tanstack/react-query";
import { settingsQueryKeys } from "../settings/settings-query-keys";

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

describe("Service History tenant currency display", () => {
  it("formats USD, PKR, and EUR using Intl currency rules", () => {
    expect(formatCurrency("125.00", "USD", "en-US")).toBe("$125.00");
    expect(formatCurrency("125.00", "PKR", "en-US")).toContain("PKR");
    expect(formatCurrency("125.00", "EUR", "en-US")).toBe("€125.00");
  });

  it("safely handles invalid values and currency codes", () => {
    expect(formatCurrency("not-a-decimal", "USD")).toBe(INVALID_CURRENCY_VALUE);
    expect(formatCurrency(undefined, "USD")).toBe(INVALID_CURRENCY_VALUE);
    expect(formatCurrency("  ", "USD")).toBe(INVALID_CURRENCY_VALUE);
    expect(formatCurrency("10.00", "invalid", "en-US")).toBe("$10.00");
  });

  it("uses one currency for list subtotal and all detail amounts", () => {
    expect(formatServiceHistorySubtotal("100.00", "GBP")).toContain("£");
    const amounts = formatServiceLineItemAmounts(
      { unitPrice: "25.00", lineTotal: "100.00" },
      "GBP",
    );
    expect(amounts.unitPrice).toContain("£");
    expect(amounts.lineTotal).toContain("£");
  });

  it("changes display currency from cached tenant settings without conversion", () => {
    const client = new QueryClient();
    client.setQueryData(settingsQueryKeys.all, { currencyCode: "USD" });
    const usd = client.getQueryData<{ currencyCode: string }>(
      settingsQueryKeys.all,
    )?.currencyCode;
    client.setQueryData(settingsQueryKeys.all, { currencyCode: "PKR" });
    const pkr = client.getQueryData<{ currencyCode: string }>(
      settingsQueryKeys.all,
    )?.currencyCode;

    expect(
      formatServiceHistorySubtotal("100.00", usd ?? DEFAULT_CURRENCY_CODE),
    ).toBe("$100.00");
    const formatted = formatServiceHistorySubtotal(
      "100.00",
      pkr ?? DEFAULT_CURRENCY_CODE,
    );
    expect(formatted).toContain("PKR");
    expect(formatted).toContain("100.00");
  });
});

describe("initial line-item creation", () => {
  const historyInput = {
    branchId: validHistory.branchId,
    customerId: validHistory.customerId,
    vehicleId: validHistory.vehicleId,
    visitDate: "2026-08-06T11:30:00",
    initialRequest: "Oil change",
  };
  const lineItem = {
    type: "SERVICE" as const,
    description: "Oil change",
    quantity: "1.125",
    unitPrice: "50.00",
  };
  const created = { id: "history-id" };

  it("creates a Service History without sending line-item data when unchecked", async () => {
    const service = {
      create: vi.fn().mockResolvedValue(created),
      createLineItem: vi.fn(),
    };
    await createServiceHistoryWithInitialLineItem(
      historyInput,
      service as never,
    );
    expect(service.create).toHaveBeenCalledWith(historyInput);
    expect(service.createLineItem).not.toHaveBeenCalled();
  });

  it("uses the returned ID for a valid decimal line item", async () => {
    const service = {
      create: vi.fn().mockResolvedValue(created),
      createLineItem: vi.fn().mockResolvedValue({}),
    };
    await createServiceHistoryWithInitialLineItem(
      { ...historyInput, lineItems: [lineItem] },
      service as never,
    );
    expect(service.create).toHaveBeenCalledWith(historyInput);
    expect(service.createLineItem).toHaveBeenCalledWith("history-id", lineItem);
  });

  it("blocks missing fields and excludes stale values after deselection", () => {
    expect(() =>
      initialLineItemsForPayload(true, { ...lineItem, description: "" }),
    ).toThrow();
    expect(initialLineItemsForPayload(false, lineItem)).toBeUndefined();
    expect(
      initialLineItemsForPayload(true, { ...lineItem, notes: " " }),
    ).toEqual([{ ...lineItem, notes: undefined }]);
  });

  it("does not retry or duplicate the draft when line-item creation fails", async () => {
    const service = {
      create: vi.fn().mockResolvedValue(created),
      createLineItem: vi.fn().mockRejectedValue(new Error("line failed")),
    };
    await expect(
      createServiceHistoryWithInitialLineItem(
        { ...historyInput, lineItems: [lineItem] },
        service as never,
      ),
    ).rejects.toBeInstanceOf(InitialLineItemCreationError);
    expect(service.create).toHaveBeenCalledTimes(1);
    expect(service.createLineItem).toHaveBeenCalledTimes(1);
  });

  it("extracts backend validation messages", () => {
    const error = new axios.AxiosError();
    error.response = {
      data: { message: ["quantity must be greater than zero"] },
    } as never;
    expect(serviceHistoryErrorMessage(error)).toBe(
      "quantity must be greater than zero",
    );
  });
});

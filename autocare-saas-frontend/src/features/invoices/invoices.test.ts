import { describe, expect, it } from "vitest";
import { formatCurrency } from "../../lib/currency";
import { invoiceKeys } from "./invoice-query-keys";
import { invoiceEditSchema, invoiceLineSchema } from "./invoice-schema";

describe("Invoice forms", () => {
  it("accepts valid backend-owned decimal inputs", () => {
    expect(
      invoiceLineSchema.parse({
        type: "PART",
        description: "Oil filter",
        quantity: "2",
        unitPrice: "12.50",
        taxRate: "10",
      }),
    ).toEqual(expect.objectContaining({ quantity: "2", taxRate: "10" }));
    expect(
      invoiceEditSchema.safeParse({
        dueDate: "",
        taxLabel: "GST",
        discountAmount: "5.00",
        notes: "",
        internalNotes: "",
      }).success,
    ).toBe(true);
  });

  it("rejects zero quantity, negative prices, and tax above 100", () => {
    const valid = {
      type: "SERVICE",
      description: "Labor",
      quantity: "1",
      unitPrice: "10",
      taxRate: "0",
    };
    expect(
      invoiceLineSchema.safeParse({ ...valid, quantity: "0" }).success,
    ).toBe(false);
    expect(
      invoiceLineSchema.safeParse({ ...valid, unitPrice: "-1" }).success,
    ).toBe(false);
    expect(
      invoiceLineSchema.safeParse({ ...valid, taxRate: "100.01" }).success,
    ).toBe(false);
  });
});

describe("Invoice cache and currency behavior", () => {
  it("keeps customer filters in server-backed list query keys", () => {
    const filters = {
      page: 1,
      limit: 5,
      customerId: "customer-id",
      status: "PAID" as const,
    };
    expect(invoiceKeys.list(filters)).toEqual(["invoices", "list", filters]);
  });

  it("formats every amount with tenant currency without conversion", () => {
    expect(formatCurrency("155.00", "USD", "en-US")).toBe("$155.00");
    expect(formatCurrency("155.00", "PKR", "en-US")).toContain("PKR");
  });
});

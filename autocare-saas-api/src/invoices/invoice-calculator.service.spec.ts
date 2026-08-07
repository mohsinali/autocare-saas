import { BadRequestException } from "@nestjs/common";
import { InvoiceCalculatorService } from "./invoice-calculator.service";

describe("InvoiceCalculatorService", () => {
  const calculator = new InvoiceCalculatorService();

  it("calculates quantity, price, and zero tax exactly", () => {
    const result = calculator.calculateLine({
      quantity: "2.5",
      unitPrice: "10.20",
      taxRate: "0",
    });
    expect(result.lineSubtotal.toFixed(2)).toBe("25.50");
    expect(result.taxAmount.toFixed(2)).toBe("0.00");
    expect(result.lineTotal.toFixed(2)).toBe("25.50");
  });

  it("calculates tax and preserves decimal accuracy", () => {
    const result = calculator.calculateLine({
      quantity: "3",
      unitPrice: "0.10",
      taxRate: "7.5",
    });
    expect(result.lineSubtotal.toFixed(2)).toBe("0.30");
    expect(result.taxAmount.toFixed(2)).toBe("0.02");
    expect(result.lineTotal.toFixed(2)).toBe("0.32");
  });

  it("sums multiple tax rates and applies an invoice discount", () => {
    const lines = [
      calculator.calculateLine({
        quantity: "1",
        unitPrice: "100",
        taxRate: "5",
      }),
      calculator.calculateLine({
        quantity: "2",
        unitPrice: "50",
        taxRate: "10",
      }),
    ];
    const totals = calculator.calculateInvoice(lines, "15");
    expect(totals.subtotal.toFixed(2)).toBe("200.00");
    expect(totals.taxAmount.toFixed(2)).toBe("15.00");
    expect(totals.totalAmount.toFixed(2)).toBe("200.00");
  });

  it.each([
    ["0", "1", "0"],
    ["1", "-1", "0"],
    ["1", "1", "101"],
  ])("rejects invalid line values", (quantity, unitPrice, taxRate) => {
    expect(() =>
      calculator.calculateLine({ quantity, unitPrice, taxRate }),
    ).toThrow(BadRequestException);
  });

  it("rejects a discount above subtotal and tax", () => {
    const line = calculator.calculateLine({
      quantity: "1",
      unitPrice: "10",
      taxRate: "0",
    });
    expect(() => calculator.calculateInvoice([line], "10.01")).toThrow(
      BadRequestException,
    );
  });
});

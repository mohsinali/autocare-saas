import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

export interface CalculableLineItem {
  quantity: Prisma.Decimal | string;
  unitPrice: Prisma.Decimal | string;
  taxRate: Prisma.Decimal | string;
}

@Injectable()
export class InvoiceCalculatorService {
  calculateLine(item: CalculableLineItem) {
    const quantity = new Prisma.Decimal(item.quantity);
    const unitPrice = new Prisma.Decimal(item.unitPrice);
    const taxRate = new Prisma.Decimal(item.taxRate);
    if (quantity.lte(0))
      throw new BadRequestException("Quantity must be greater than zero");
    if (unitPrice.lt(0))
      throw new BadRequestException("Unit price must not be negative");
    if (taxRate.lt(0) || taxRate.gt(100))
      throw new BadRequestException("Tax rate must be between 0 and 100");
    const lineSubtotal = quantity.mul(unitPrice).toDecimalPlaces(2);
    const taxAmount = lineSubtotal.mul(taxRate).div(100).toDecimalPlaces(2);
    return {
      quantity,
      unitPrice,
      taxRate,
      lineSubtotal,
      taxAmount,
      lineTotal: lineSubtotal.add(taxAmount),
    };
  }

  calculateInvoice(
    lines: Array<{ lineSubtotal: Prisma.Decimal; taxAmount: Prisma.Decimal }>,
    discount: Prisma.Decimal | string,
  ) {
    const discountAmount = new Prisma.Decimal(discount);
    if (discountAmount.lt(0))
      throw new BadRequestException("Discount amount must not be negative");
    const subtotal = lines.reduce(
      (sum, line) => sum.add(line.lineSubtotal),
      new Prisma.Decimal(0),
    );
    const taxAmount = lines.reduce(
      (sum, line) => sum.add(line.taxAmount),
      new Prisma.Decimal(0),
    );
    if (discountAmount.gt(subtotal.add(taxAmount)))
      throw new BadRequestException(
        "Discount amount must not exceed subtotal plus tax",
      );
    const totalAmount = subtotal.add(taxAmount).sub(discountAmount);
    if (totalAmount.lt(0))
      throw new BadRequestException("Invoice total must not be negative");
    return { subtotal, taxAmount, discountAmount, totalAmount };
  }
}

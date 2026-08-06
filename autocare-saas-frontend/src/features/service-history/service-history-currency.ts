import { formatCurrency } from "../../lib/currency";

export function formatServiceHistorySubtotal(
  subtotal: number | string | null | undefined,
  currencyCode: string,
): string {
  return formatCurrency(subtotal, currencyCode);
}

export function formatServiceLineItemAmounts(
  lineItem: {
    unitPrice: number | string | null | undefined;
    lineTotal: number | string | null | undefined;
  },
  currencyCode: string,
): { unitPrice: string; lineTotal: string } {
  return {
    unitPrice: formatCurrency(lineItem.unitPrice, currencyCode),
    lineTotal: formatCurrency(lineItem.lineTotal, currencyCode),
  };
}

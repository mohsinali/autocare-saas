export const DEFAULT_CURRENCY_CODE = "USD";
export const INVALID_CURRENCY_VALUE = "—";

export function formatCurrency(
  value: number | string | null | undefined,
  currencyCode = DEFAULT_CURRENCY_CODE,
  locale?: string,
): string {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  )
    return INVALID_CURRENCY_VALUE;

  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return INVALID_CURRENCY_VALUE;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: DEFAULT_CURRENCY_CODE,
    }).format(amount);
  }
}

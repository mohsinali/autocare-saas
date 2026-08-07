import type { InvoiceStatus } from "@/types";
export function InvoiceStatusBadge({
  status,
}: {
  status: InvoiceStatus;
}): React.JSX.Element {
  const styles =
    status === "PAID"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
      : status === "ISSUED"
        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
        : status === "VOID"
          ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}

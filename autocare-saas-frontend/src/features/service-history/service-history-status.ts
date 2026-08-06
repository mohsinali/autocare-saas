import type { ServiceHistoryStatus } from "@/types";

export function canEditServiceHistory(status: ServiceHistoryStatus): boolean {
  return status === "DRAFT";
}

export function canCancelServiceHistory(
  status: ServiceHistoryStatus,
  activeLineItems: number,
): boolean {
  return status === "DRAFT" && activeLineItems === 0;
}

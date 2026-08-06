import type { ServiceHistoryFilters } from "@/services/api/service-history.service";
import { appointmentKeys } from "../appointments/appointment-query-keys";

export const serviceHistoryKeys = {
  all: ["service-history"] as const,
  lists: () => [...serviceHistoryKeys.all, "list"] as const,
  list: (filters: ServiceHistoryFilters) =>
    [...serviceHistoryKeys.lists(), filters] as const,
  details: () => [...serviceHistoryKeys.all, "detail"] as const,
  detail: (id: string) => [...serviceHistoryKeys.details(), id] as const,
  lineItems: (id: string) =>
    [...serviceHistoryKeys.detail(id), "line-items"] as const,
};

export function serviceHistoryInvalidationKeys(
  id?: string,
  refreshVehicle = false,
): readonly (readonly unknown[])[] {
  return [
    serviceHistoryKeys.lists(),
    ...(id
      ? [serviceHistoryKeys.detail(id), serviceHistoryKeys.lineItems(id)]
      : []),
    ...(refreshVehicle ? [["vehicles"] as const] : []),
    appointmentKeys.dashboard(),
  ];
}

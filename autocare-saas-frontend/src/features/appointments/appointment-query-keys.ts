import type {
  AppointmentCalendarParams,
  AppointmentFilters,
} from "@/services/api/appointments.service";

export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: AppointmentFilters) =>
    [...appointmentKeys.lists(), filters] as const,
  calendars: () => [...appointmentKeys.all, "calendar"] as const,
  calendar: (range: AppointmentCalendarParams) =>
    [...appointmentKeys.calendars(), range] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  customer: (
    customerId: string,
    filters: Omit<AppointmentFilters, "customerId">,
  ) => [...appointmentKeys.all, "customer", customerId, filters] as const,
  dashboard: () => [...appointmentKeys.all, "dashboard"] as const,
};

"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  appointmentsService,
  normalizeAppointmentFilters,
  type AppointmentCalendarParams,
  type AppointmentFilters,
  type CreateAppointmentInput,
  type RescheduleAppointmentInput,
  type StatusUpdateInput,
  type UpdateAppointmentInput,
} from "@/services/api/appointments.service";
import { appointmentKeys } from "./appointment-query-keys";

const staleTime = 30_000;
export function useAppointments(filters: AppointmentFilters) {
  const normalized = normalizeAppointmentFilters(filters);
  return useQuery({
    queryKey: appointmentKeys.list(normalized),
    queryFn: () => appointmentsService.list(normalized),
    staleTime,
  });
}
export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => appointmentsService.get(id),
    enabled: Boolean(id),
    staleTime,
  });
}
export function useAppointmentCalendar(params: AppointmentCalendarParams) {
  return useQuery({
    queryKey: appointmentKeys.calendar(params),
    queryFn: () => appointmentsService.calendar(params),
    enabled: Boolean(params.startDate && params.endDate),
    staleTime: 15_000,
  });
}
export function useCustomerAppointments(
  customerId: string,
  filters: Omit<AppointmentFilters, "customerId">,
) {
  return useQuery({
    queryKey: appointmentKeys.customer(customerId, filters),
    queryFn: () => appointmentsService.list({ ...filters, customerId }),
    enabled: Boolean(customerId),
    staleTime,
  });
}
function useRefreshAppointments() {
  const client = useQueryClient();
  return (id?: string) => {
    void client.invalidateQueries({ queryKey: appointmentKeys.lists() });
    void client.invalidateQueries({ queryKey: appointmentKeys.calendars() });
    void client.invalidateQueries({
      queryKey: [...appointmentKeys.all, "customer"],
    });
    void client.invalidateQueries({ queryKey: appointmentKeys.dashboard() });
    if (id)
      void client.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
  };
}
export function useCreateAppointment() {
  const refresh = useRefreshAppointments();
  return useMutation({
    mutationFn: (input: CreateAppointmentInput) =>
      appointmentsService.create(input),
    onSuccess: (item) => {
      refresh(item.id);
      toast.success("Appointment scheduled");
    },
    onError: () => toast.error("Could not schedule appointment"),
  });
}
export function useUpdateAppointment(id: string) {
  const refresh = useRefreshAppointments();
  return useMutation({
    mutationFn: (input: UpdateAppointmentInput) =>
      appointmentsService.update(id, input),
    onSuccess: () => {
      refresh(id);
      toast.success("Appointment updated");
    },
    onError: () => toast.error("Could not update appointment"),
  });
}
export function useRescheduleAppointment(id: string) {
  const refresh = useRefreshAppointments();
  return useMutation({
    mutationFn: (input: RescheduleAppointmentInput) =>
      appointmentsService.reschedule(id, input),
    onSuccess: () => {
      refresh(id);
      toast.success("Appointment rescheduled");
    },
    onError: () => toast.error("Could not reschedule appointment"),
  });
}
export function useUpdateAppointmentStatus(id: string) {
  const refresh = useRefreshAppointments();
  return useMutation({
    mutationFn: (input: StatusUpdateInput) =>
      appointmentsService.updateStatus(id, input),
    onSuccess: () => {
      refresh(id);
      toast.success("Appointment status updated");
    },
    onError: () => toast.error("Could not change appointment status"),
  });
}
export function useCancelAppointment(id: string) {
  const refresh = useRefreshAppointments();
  return useMutation({
    mutationFn: () => appointmentsService.cancel(id),
    onSuccess: () => {
      refresh(id);
      toast.success("Appointment cancelled");
    },
    onError: () => toast.error("Could not cancel appointment"),
  });
}
export function useDeleteAppointment(id: string) {
  const refresh = useRefreshAppointments();
  return useMutation({
    mutationFn: () => appointmentsService.remove(id),
    onSuccess: () => {
      refresh();
      toast.success("Appointment deleted");
    },
    onError: () => toast.error("Could not delete appointment"),
  });
}

import { api } from "./client";
import type {
  Appointment,
  AppointmentStatus,
  PaginatedAppointments,
} from "@/types";

export interface AppointmentFilters {
  page: number;
  limit: number;
  search?: string;
  branchId?: string;
  customerId?: string;
  vehicleId?: string;
  status?: AppointmentStatus;
  serviceType?: string;
  startDate?: string;
  endDate?: string;
  today?: boolean;
  tomorrow?: boolean;
  upcoming?: boolean;
  sortBy?: "appointmentDateTimeUtc" | "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
}
export interface AppointmentCalendarParams {
  startDate: string;
  endDate: string;
  branchId?: string;
}
export interface CreateAppointmentInput {
  branchId: string;
  vehicleId: string;
  appointmentDateTime: string;
  estimatedDurationMinutes: number;
  serviceRequested: string;
  notes?: string;
}
export interface UpdateAppointmentInput {
  estimatedDurationMinutes?: number;
  serviceRequested?: string;
  notes?: string;
}
export interface RescheduleAppointmentInput {
  appointmentDateTime: string;
}
export interface StatusUpdateInput {
  status: AppointmentStatus;
}

export const appointmentsService = {
  async list(params: AppointmentFilters): Promise<PaginatedAppointments> {
    return (await api.get<PaginatedAppointments>("/appointments", { params }))
      .data;
  },
  async calendar(params: AppointmentCalendarParams): Promise<Appointment[]> {
    return (await api.get<Appointment[]>("/appointments/calendar", { params }))
      .data;
  },
  async get(id: string): Promise<Appointment> {
    return (await api.get<Appointment>(`/appointments/${id}`)).data;
  },
  async create(input: CreateAppointmentInput): Promise<Appointment> {
    return (await api.post<Appointment>("/appointments", input)).data;
  },
  async update(
    id: string,
    input: UpdateAppointmentInput,
  ): Promise<Appointment> {
    return (await api.patch<Appointment>(`/appointments/${id}`, input)).data;
  },
  async reschedule(
    id: string,
    input: RescheduleAppointmentInput,
  ): Promise<Appointment> {
    return (
      await api.patch<Appointment>(`/appointments/${id}/reschedule`, input)
    ).data;
  },
  async updateStatus(
    id: string,
    input: StatusUpdateInput,
  ): Promise<Appointment> {
    return (await api.patch<Appointment>(`/appointments/${id}/status`, input))
      .data;
  },
  async cancel(id: string): Promise<Appointment> {
    return this.updateStatus(id, { status: "CANCELLED" });
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  },
  async listToday(): Promise<PaginatedAppointments> {
    return this.list({ page: 1, limit: 5, today: true });
  },
};

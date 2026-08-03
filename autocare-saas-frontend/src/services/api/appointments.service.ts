import { api } from './client';
import type { PaginatedAppointments } from '@/types';

export const appointmentsService = {
  async listToday(): Promise<PaginatedAppointments> { return (await api.get<PaginatedAppointments>('/appointments', { params: { page: 1, limit: 1, today: true } })).data; },
};

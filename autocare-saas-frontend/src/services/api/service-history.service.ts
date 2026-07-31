import { api } from './client'; import type { ServiceHistory } from '@/types';
export interface ServiceHistoryInput { customerId: string; serviceDate: string; description: string; mileage?: number; totalAmount: number; }
export const serviceHistoryService = { async list(customerId: string): Promise<ServiceHistory[]> { return (await api.get<ServiceHistory[]>(`/service-history/customer/${customerId}`)).data; }, async create(input: ServiceHistoryInput): Promise<ServiceHistory> { return (await api.post<ServiceHistory>('/service-history', input)).data; } };

import { api } from "./client";
import type {
  PaginatedServiceHistories,
  ServiceHistory,
  ServiceHistoryStatus,
  ServiceLineItem,
  ServiceLineItemType,
} from "@/types";

export interface ServiceHistoryFilters {
  page: number;
  limit: number;
  branchId?: string;
  customerId?: string;
  vehicleId?: string;
  appointmentId?: string;
  status?: ServiceHistoryStatus;
  visitDateFrom?: string;
  visitDateTo?: string;
  search?: string;
  sortBy?: "visitDate" | "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
}
export interface ServiceLineItemInput {
  type: ServiceLineItemType;
  description: string;
  quantity: string;
  unitPrice: string;
  notes?: string;
  sortOrder?: number;
}
export interface ServiceHistoryInput {
  branchId: string;
  customerId: string;
  vehicleId: string;
  appointmentId?: string;
  visitDate: string;
  mileageAtService?: number;
  customerComplaint?: string;
  initialRequest: string;
  diagnosis?: string;
  workSummary?: string;
  recommendations?: string;
  internalNotes?: string;
  lineItems?: ServiceLineItemInput[];
}
export type UpdateServiceHistoryInput = Partial<
  Omit<ServiceHistoryInput, "lineItems">
>;
export interface CompleteServiceHistoryInput {
  mileageAtService?: number;
  workSummary?: string;
  recommendations?: string;
}
export interface ServiceLineItemsResponse {
  data: ServiceLineItem[];
  subtotal: string;
}

export const serviceHistoryService = {
  async list(
    params: ServiceHistoryFilters,
  ): Promise<PaginatedServiceHistories> {
    return (
      await api.get<PaginatedServiceHistories>("/service-history", { params })
    ).data;
  },
  async get(id: string): Promise<ServiceHistory> {
    return (await api.get<ServiceHistory>(`/service-history/${id}`)).data;
  },
  async create(input: ServiceHistoryInput): Promise<ServiceHistory> {
    return (await api.post<ServiceHistory>("/service-history", input)).data;
  },
  async update(
    id: string,
    input: UpdateServiceHistoryInput,
  ): Promise<ServiceHistory> {
    return (await api.patch<ServiceHistory>(`/service-history/${id}`, input))
      .data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/service-history/${id}`);
  },
  async complete(
    id: string,
    input: CompleteServiceHistoryInput,
  ): Promise<ServiceHistory> {
    return (
      await api.patch<ServiceHistory>(`/service-history/${id}/complete`, input)
    ).data;
  },
  async cancel(id: string, reason?: string): Promise<ServiceHistory> {
    return (
      await api.patch<ServiceHistory>(`/service-history/${id}/cancel`, {
        reason,
      })
    ).data;
  },
  async listLineItems(id: string): Promise<ServiceLineItemsResponse> {
    return (
      await api.get<ServiceLineItemsResponse>(
        `/service-history/${id}/line-items`,
      )
    ).data;
  },
  async createLineItem(
    id: string,
    input: ServiceLineItemInput,
  ): Promise<ServiceLineItem> {
    return (
      await api.post<ServiceLineItem>(
        `/service-history/${id}/line-items`,
        input,
      )
    ).data;
  },
  async updateLineItem(
    historyId: string,
    lineItemId: string,
    input: Partial<ServiceLineItemInput>,
  ): Promise<ServiceLineItem> {
    return (
      await api.patch<ServiceLineItem>(
        `/service-history/${historyId}/line-items/${lineItemId}`,
        input,
      )
    ).data;
  },
  async removeLineItem(historyId: string, lineItemId: string): Promise<void> {
    await api.delete(`/service-history/${historyId}/line-items/${lineItemId}`);
  },
};

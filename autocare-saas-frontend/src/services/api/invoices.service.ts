import type {
  Invoice,
  InvoiceStatus,
  PaginatedInvoices,
  ServiceLineItemType,
} from "@/types";
import { api } from "./client";

export interface InvoiceFilters {
  page: number;
  limit: number;
  status?: InvoiceStatus;
  branchId?: string;
  customerId?: string;
  vehicleId?: string;
  serviceHistoryId?: string;
  invoiceNumber?: string;
  issueDateFrom?: string;
  issueDateTo?: string;
  search?: string;
}
export interface UpdateInvoiceInput {
  dueDate?: string;
  taxLabel?: string;
  discountAmount?: string;
  notes?: string;
  internalNotes?: string;
}
export interface InvoiceLineItemInput {
  type?: ServiceLineItemType;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate?: string;
  sortOrder?: number;
}

export const invoicesService = {
  async list(params: InvoiceFilters): Promise<PaginatedInvoices> {
    return (await api.get<PaginatedInvoices>("/invoices", { params })).data;
  },
  async get(id: string): Promise<Invoice> {
    return (await api.get<Invoice>(`/invoices/${id}`)).data;
  },
  async createFromServiceHistory(id: string): Promise<Invoice> {
    return (await api.post<Invoice>(`/service-histories/${id}/invoice`)).data;
  },
  async update(id: string, input: UpdateInvoiceInput): Promise<Invoice> {
    return (await api.patch<Invoice>(`/invoices/${id}`, input)).data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },
  async addLineItem(id: string, input: InvoiceLineItemInput): Promise<Invoice> {
    return (await api.post<Invoice>(`/invoices/${id}/line-items`, input)).data;
  },
  async updateLineItem(
    id: string,
    lineId: string,
    input: Partial<InvoiceLineItemInput>,
  ): Promise<Invoice> {
    return (
      await api.patch<Invoice>(`/invoices/${id}/line-items/${lineId}`, input)
    ).data;
  },
  async removeLineItem(id: string, lineId: string): Promise<void> {
    await api.delete(`/invoices/${id}/line-items/${lineId}`);
  },
  async issue(id: string): Promise<Invoice> {
    return (await api.post<Invoice>(`/invoices/${id}/issue`)).data;
  },
  async markPaid(id: string): Promise<Invoice> {
    return (await api.post<Invoice>(`/invoices/${id}/mark-paid`)).data;
  },
  async void(id: string): Promise<Invoice> {
    return (await api.post<Invoice>(`/invoices/${id}/void`)).data;
  },
};

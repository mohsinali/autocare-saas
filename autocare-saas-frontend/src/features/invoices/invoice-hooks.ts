"use client";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  invoicesService,
  type InvoiceFilters,
  type InvoiceLineItemInput,
  type UpdateInvoiceInput,
} from "@/services/api/invoices.service";
import { serviceHistoryKeys } from "@/features/service-history/service-history-query-keys";
import { invoiceKeys } from "./invoice-query-keys";

function message(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const value = error.response?.data?.message;
    if (Array.isArray(value)) return value.join(". ");
    if (typeof value === "string") return value;
  }
  return "The invoice action could not be completed";
}
export function useInvoices(filters: InvoiceFilters) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => invoicesService.list(filters),
    staleTime: 30_000,
  });
}
export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesService.get(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}
function useRefreshInvoice(id?: string, serviceHistoryId?: string) {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: invoiceKeys.lists() });
    if (id) void client.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
    if (serviceHistoryId)
      void client.invalidateQueries({
        queryKey: serviceHistoryKeys.detail(serviceHistoryId),
      });
  };
}
export function useCreateInvoice() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: invoicesService.createFromServiceHistory,
    onSuccess: (invoice) => {
      client.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      void client.invalidateQueries({ queryKey: invoiceKeys.lists() });
      void client.invalidateQueries({
        queryKey: serviceHistoryKeys.detail(invoice.serviceHistoryId),
      });
      toast.success("Draft invoice created");
    },
    onError: (error) => toast.error(message(error)),
  });
}
export function useUpdateInvoice(id: string, historyId: string) {
  const refresh = useRefreshInvoice(id, historyId);
  return useMutation({
    mutationFn: (input: UpdateInvoiceInput) =>
      invoicesService.update(id, input),
    onSuccess: () => {
      refresh();
      toast.success("Invoice updated");
    },
    onError: (error) => toast.error(message(error)),
  });
}
export function useAddInvoiceLineItem(id: string) {
  const refresh = useRefreshInvoice(id);
  return useMutation({
    mutationFn: (input: InvoiceLineItemInput) =>
      invoicesService.addLineItem(id, input),
    onSuccess: () => {
      refresh();
      toast.success("Line item added");
    },
    onError: (error) => toast.error(message(error)),
  });
}
export function useUpdateInvoiceLineItem(id: string) {
  const refresh = useRefreshInvoice(id);
  return useMutation({
    mutationFn: ({
      lineId,
      input,
    }: {
      lineId: string;
      input: Partial<InvoiceLineItemInput>;
    }) => invoicesService.updateLineItem(id, lineId, input),
    onSuccess: () => {
      refresh();
      toast.success("Line item updated");
    },
    onError: (error) => toast.error(message(error)),
  });
}
export function useDeleteInvoiceLineItem(id: string) {
  const refresh = useRefreshInvoice(id);
  return useMutation({
    mutationFn: (lineId: string) => invoicesService.removeLineItem(id, lineId),
    onSuccess: () => {
      refresh();
      toast.success("Line item removed");
    },
    onError: (error) => toast.error(message(error)),
  });
}
export function useInvoiceAction(id: string, historyId: string) {
  const refresh = useRefreshInvoice(id, historyId);
  const config = (success: string) => ({
    onSuccess: () => {
      refresh();
      toast.success(success);
    },
    onError: (error: unknown) => toast.error(message(error)),
  });
  return {
    issue: useMutation({
      mutationFn: () => invoicesService.issue(id),
      ...config("Invoice issued"),
    }),
    markPaid: useMutation({
      mutationFn: () => invoicesService.markPaid(id),
      ...config("Invoice marked as paid"),
    }),
    voidInvoice: useMutation({
      mutationFn: () => invoicesService.void(id),
      ...config("Invoice voided"),
    }),
  };
}
export function useDeleteInvoice(id: string, historyId: string) {
  const refresh = useRefreshInvoice(undefined, historyId);
  return useMutation({
    mutationFn: () => invoicesService.remove(id),
    onSuccess: () => {
      refresh();
      toast.success("Draft invoice deleted");
    },
    onError: (error) => toast.error(message(error)),
  });
}

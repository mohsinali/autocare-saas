"use client";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  serviceHistoryService,
  type CompleteServiceHistoryInput,
  type ServiceHistoryFilters,
  type ServiceHistoryInput,
  type ServiceLineItemInput,
  type UpdateServiceHistoryInput,
} from "@/services/api/service-history.service";
import {
  serviceHistoryInvalidationKeys,
  serviceHistoryKeys,
} from "./service-history-query-keys";
import {
  createServiceHistoryWithInitialLineItem,
  InitialLineItemCreationError,
} from "./service-history-create";
import { serviceHistoryErrorMessage } from "./service-history-error";

const staleTime = 30_000;
export function useServiceHistories(filters: ServiceHistoryFilters) {
  return useQuery({
    queryKey: serviceHistoryKeys.list(filters),
    queryFn: () => serviceHistoryService.list(filters),
    staleTime,
  });
}
export function useServiceHistory(id: string) {
  return useQuery({
    queryKey: serviceHistoryKeys.detail(id),
    queryFn: () => serviceHistoryService.get(id),
    enabled: Boolean(id),
    staleTime,
  });
}
export function useServiceLineItems(id: string) {
  return useQuery({
    queryKey: serviceHistoryKeys.lineItems(id),
    queryFn: () => serviceHistoryService.listLineItems(id),
    enabled: Boolean(id),
    staleTime,
  });
}
function useRefreshServiceHistory() {
  const client = useQueryClient();
  return (id?: string, refreshVehicle = false) => {
    for (const queryKey of serviceHistoryInvalidationKeys(id, refreshVehicle))
      void client.invalidateQueries({ queryKey });
  };
}
function useStatusConflictRefresh(id: string) {
  const client = useQueryClient();
  return (error: unknown, fallback: string) => {
    toast.error(serviceHistoryErrorMessage(error) || fallback);
    if (
      axios.isAxiosError(error) &&
      [400, 409].includes(error.response?.status ?? 0)
    )
      void client.invalidateQueries({
        queryKey: serviceHistoryKeys.detail(id),
      });
  };
}
export function useCreateServiceHistory() {
  const refresh = useRefreshServiceHistory();
  return useMutation({
    mutationFn: (input: ServiceHistoryInput) =>
      createServiceHistoryWithInitialLineItem(input),
    onSuccess: (item) => {
      refresh(item.id);
      toast.success("Active job created");
    },
    onError: (error) => {
      if (error instanceof InitialLineItemCreationError) {
        refresh(error.serviceHistory.id);
        toast.error(
          "The active job was created, but its initial line item could not be added.",
        );
      } else toast.error(serviceHistoryErrorMessage(error));
    },
  });
}

export function useUpdateServiceHistory(id: string) {
  const refresh = useRefreshServiceHistory();
  const conflict = useStatusConflictRefresh(id);
  return useMutation({
    mutationFn: (input: UpdateServiceHistoryInput) =>
      serviceHistoryService.update(id, input),
    onSuccess: () => {
      refresh(id);
      toast.success("Job details updated");
    },
    onError: (error) => conflict(error, "Could not update job"),
  });
}
export function useDeleteServiceHistory(id: string) {
  const refresh = useRefreshServiceHistory();
  const conflict = useStatusConflictRefresh(id);
  return useMutation({
    mutationFn: () => serviceHistoryService.remove(id),
    onSuccess: () => {
      refresh();
      toast.success("Draft deleted");
    },
    onError: (error) => conflict(error, "Could not delete draft"),
  });
}
export function useCompleteServiceHistory(id: string) {
  const refresh = useRefreshServiceHistory();
  const conflict = useStatusConflictRefresh(id);
  return useMutation({
    mutationFn: (input: CompleteServiceHistoryInput) =>
      serviceHistoryService.complete(id, input),
    onSuccess: () => {
      refresh(id, true);
      toast.success("Service completed and vehicle mileage updated");
    },
    onError: (error) => conflict(error, "Could not complete service"),
  });
}
export function useCancelServiceHistory(id: string) {
  const refresh = useRefreshServiceHistory();
  const conflict = useStatusConflictRefresh(id);
  return useMutation({
    mutationFn: (reason?: string) => serviceHistoryService.cancel(id, reason),
    onSuccess: () => {
      refresh(id);
      toast.success("Job cancelled");
    },
    onError: (error) => conflict(error, "Could not cancel job"),
  });
}
export function useCreateServiceLineItem(id: string) {
  const refresh = useRefreshServiceHistory();
  const conflict = useStatusConflictRefresh(id);
  return useMutation({
    mutationFn: (input: ServiceLineItemInput) =>
      serviceHistoryService.createLineItem(id, input),
    onSuccess: () => {
      refresh(id);
      toast.success("Line item added");
    },
    onError: (error) => conflict(error, "Could not add line item"),
  });
}
export function useUpdateServiceLineItem(id: string) {
  const refresh = useRefreshServiceHistory();
  const conflict = useStatusConflictRefresh(id);
  return useMutation({
    mutationFn: ({
      lineItemId,
      input,
    }: {
      lineItemId: string;
      input: Partial<ServiceLineItemInput>;
    }) => serviceHistoryService.updateLineItem(id, lineItemId, input),
    onSuccess: () => {
      refresh(id);
      toast.success("Line item updated");
    },
    onError: (error) => conflict(error, "Could not update line item"),
  });
}
export function useDeleteServiceLineItem(id: string) {
  const refresh = useRefreshServiceHistory();
  const conflict = useStatusConflictRefresh(id);
  return useMutation({
    mutationFn: (lineItemId: string) =>
      serviceHistoryService.removeLineItem(id, lineItemId),
    onSuccess: () => {
      refresh(id);
      toast.success("Line item removed");
    },
    onError: (error) => conflict(error, "Could not remove line item"),
  });
}

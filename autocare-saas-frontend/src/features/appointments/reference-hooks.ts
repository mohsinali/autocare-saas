"use client";
import { useQuery } from "@tanstack/react-query";
import { branchesService } from "@/services/api/branches.service";
import { customersService } from "@/services/api/customers.service";
import { vehiclesService } from "@/services/api/vehicles.service";

export function useBranches() {
  return useQuery({
    queryKey: ["branches", { limit: 100 }],
    queryFn: () => branchesService.list({ page: 1, limit: 100 }),
    staleTime: 300_000,
  });
}
export function useBranch(id: string) {
  return useQuery({
    queryKey: ["branches", id],
    queryFn: () => branchesService.get(id),
    enabled: Boolean(id),
    staleTime: 300_000,
  });
}
export function useCustomerSearch(search: string, enabled = true) {
  return useQuery({
    queryKey: ["customers", "appointment-search", search],
    queryFn: () =>
      customersService.list({
        page: 1,
        limit: 20,
        search: search || undefined,
      }),
    enabled,
    staleTime: 60_000,
  });
}
export function useAppointmentVehicles(customerId: string) {
  return useQuery({
    queryKey: ["vehicles", "appointment-select", customerId],
    queryFn: () => vehiclesService.list({ page: 1, limit: 100, customerId }),
    enabled: Boolean(customerId),
    staleTime: 60_000,
  });
}

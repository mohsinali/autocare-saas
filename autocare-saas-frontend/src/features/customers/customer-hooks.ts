"use client";
import { useQuery } from "@tanstack/react-query";
import { customersService } from "@/services/api/customers.service";

export function useCustomers(params: {
  page: number;
  limit: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customersService.list(params),
  });
}
export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: ["customers", customerId],
    queryFn: () => customersService.get(customerId),
    enabled: Boolean(customerId),
  });
}

"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  customersService,
  type CustomerInput,
} from "@/services/api/customers.service";

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

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => customersService.create(input),
    onSuccess: (customer) => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer added");
      return customer;
    },
    onError: () => toast.error("Could not add customer"),
  });
}

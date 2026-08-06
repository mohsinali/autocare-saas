"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  tenantSettingsService,
  type UpdateTenantSettingsInput,
} from "@/services/api/tenant-settings.service";
import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import { settingsQueryKeys } from "./settings-query-keys";

export function useTenantSettings() {
  return useQuery({
    queryKey: settingsQueryKeys.all,
    queryFn: tenantSettingsService.get,
    staleTime: 300_000,
  });
}

export function useTenantCurrency(): string {
  const settings = useTenantSettings();
  return settings.data?.currencyCode || DEFAULT_CURRENCY_CODE;
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTenantSettingsInput) =>
      tenantSettingsService.update(input),
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsQueryKeys.all, settings);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.all });
      toast.success("Workspace settings updated");
    },
  });
}

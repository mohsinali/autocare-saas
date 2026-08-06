"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TenantSettings } from "@/services/api/tenant-settings.service";
import { currencies } from "./currencies";
import { useUpdateTenantSettings } from "./settings-hooks";
import { settingsFormSchema, type SettingsFormValues } from "./settings-schema";

function errorMessage(error: unknown): string {
  const fallback = "Could not update workspace settings.";
  if (!axios.isAxiosError<{ message?: string | string[] }>(error))
    return fallback;
  const message = error.response?.data.message;
  return Array.isArray(message) ? message.join(". ") : (message ?? fallback);
}

export function SettingsForm({
  settings,
}: {
  settings: TenantSettings;
}): React.JSX.Element {
  const mutation = useUpdateTenantSettings();
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: { currencyCode: settings.currencyCode || "USD" },
  });

  useEffect(() => {
    form.reset({ currencyCode: settings.currencyCode || "USD" });
  }, [form, settings.currencyCode]);

  function submit(values: SettingsFormValues): void {
    mutation.mutate(values, {
      onSuccess: (updatedSettings) => {
        form.reset({ currencyCode: updatedSettings.currencyCode });
      },
      onError: (error) => {
        const message = errorMessage(error);
        form.setError("root", { message });
        toast.error(message);
      },
    });
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="space-y-1.5">
        <label htmlFor="currency-code" className="text-sm font-medium">
          Currency Code
        </label>
        <p className="text-xs text-slate-500">
          The currency used for this workspace.
        </p>
        <Controller
          control={form.control}
          name="currencyCode"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={mutation.isPending}
            >
              <SelectTrigger
                id="currency-code"
                aria-invalid={Boolean(form.formState.errors.currencyCode)}
              >
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} — {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.currencyCode?.message && (
          <p role="alert" className="text-xs text-red-600">
            {form.formState.errors.currencyCode.message}
          </p>
        )}
      </div>
      {form.formState.errors.root?.message && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {form.formState.errors.root.message}
        </p>
      )}
      <div className="flex justify-end">
        <Button disabled={mutation.isPending || !form.formState.isDirty}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}

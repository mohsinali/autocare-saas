"use client";

import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateVehicle } from "@/features/vehicles/vehicle-hooks";
import {
  quickVehicleSchema,
  type QuickVehicleValues,
} from "@/features/vehicles/vehicle-schema";
import type { Vehicle } from "@/types";

function errorMessage(error: unknown): string {
  if (!axios.isAxiosError<{ message?: string | string[] }>(error))
    return "Unable to create vehicle.";
  const message = error.response?.data.message;
  return Array.isArray(message)
    ? message.join(". ")
    : (message ?? "Unable to create vehicle.");
}

const defaults: QuickVehicleValues = {
  make: "",
  model: "",
  registrationNumber: "",
  year: "",
  currentMileage: 0,
};

export function QuickCreateVehicleDialog({
  open,
  customerId,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  customerId: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (vehicle: Vehicle) => void;
}): React.JSX.Element {
  const titleId = useId();
  const mutation = useCreateVehicle();
  const form = useForm<QuickVehicleValues>({
    resolver: zodResolver(quickVehicleSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) form.reset(defaults);
  }, [form, open]);

  function submit(values: QuickVehicleValues): void {
    mutation.mutate(
      {
        customerId,
        make: values.make,
        model: values.model,
        registrationNumber: values.registrationNumber || null,
        year: values.year ? Number(values.year) : null,
        currentMileage: values.currentMileage,
        status: "ACTIVE",
      },
      {
        onSuccess: (vehicle) => {
          onOpenChange(false);
          onCreated(vehicle);
        },
        onError: (error) =>
          form.setError("root", { message: errorMessage(error) }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-labelledby={titleId} aria-describedby={undefined}>
        <h2 id={titleId} className="mb-1 text-lg font-semibold">
          Add vehicle
        </h2>
        <p className="mb-5 text-sm text-slate-500">
          This vehicle will belong to the selected customer.
        </p>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(submit)}
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Make"
              required
              error={form.formState.errors.make?.message}
            >
              <Input autoFocus {...form.register("make")} />
            </Field>
            <Field
              label="Model"
              required
              error={form.formState.errors.model?.message}
            >
              <Input {...form.register("model")} />
            </Field>
            <Field
              label="Registration number"
              error={form.formState.errors.registrationNumber?.message}
            >
              <Input
                autoComplete="off"
                {...form.register("registrationNumber")}
              />
            </Field>
            <Field label="Year" error={form.formState.errors.year?.message}>
              <Input
                type="number"
                min="1886"
                max={new Date().getFullYear() + 1}
                {...form.register("year")}
              />
            </Field>
          </div>
          <Field
            label="Current mileage"
            required
            error={form.formState.errors.currentMileage?.message}
          >
            <Input type="number" min="0" {...form.register("currentMileage")} />
          </Field>
          {form.formState.errors.root?.message && (
            <p role="alert" className="text-sm text-red-600">
              {form.formState.errors.root.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !customerId}>
              {mutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Add vehicle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      {label}
      {required && <span className="text-red-600"> *</span>}
      {children}
      {error && (
        <span role="alert" className="block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

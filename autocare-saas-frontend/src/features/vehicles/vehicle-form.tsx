"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateVehicle, useUpdateVehicle } from "./vehicle-hooks";
import type { Vehicle, VehicleStatus } from "@/types";
import { vehicleFormSchema, type VehicleFormValues } from "./vehicle-schema";
const defaultValues: VehicleFormValues = {
  registrationNumber: "",
  make: "",
  model: "",
  variant: "",
  year: "",
  currentMileage: 0,
  status: "ACTIVE",
  notes: "",
};

export function VehicleForm({
  customerId,
  vehicle,
  onSuccess,
}: {
  customerId: string;
  vehicle?: Vehicle;
  onSuccess: () => void;
}): React.JSX.Element {
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues,
  });
  useEffect(() => {
    form.reset(
      vehicle
        ? {
            registrationNumber: vehicle.registrationNumber ?? "",
            make: vehicle.make ?? "",
            model: vehicle.model ?? "",
            variant: vehicle.variant ?? "",
            year: vehicle.year?.toString() ?? "",
            currentMileage: vehicle.currentMileage,
            status: vehicle.status,
            notes: vehicle.notes ?? "",
          }
        : defaultValues,
    );
  }, [form, vehicle]);
  const pending = createVehicle.isPending || updateVehicle.isPending;
  const submit = (values: VehicleFormValues): void => {
    const input = {
      customerId,
      registrationNumber: values.registrationNumber || null,
      make: values.make || null,
      model: values.model || null,
      variant: values.variant || null,
      year: values.year ? Number(values.year) : null,
      currentMileage: values.currentMileage,
      status: values.status as VehicleStatus,
      notes: values.notes || null,
    };
    if (vehicle) updateVehicle.mutate({ id: vehicle.id, input }, { onSuccess });
    else createVehicle.mutate(input, { onSuccess });
  };
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Registration number"
          error={form.formState.errors.registrationNumber?.message}
        >
          <Input autoComplete="off" {...form.register("registrationNumber")} />
        </Field>
        <Field
          label="Current mileage"
          required
          error={form.formState.errors.currentMileage?.message}
        >
          <Input type="number" min="0" {...form.register("currentMileage")} />
        </Field>
        <Field label="Make" error={form.formState.errors.make?.message}>
          <Input {...form.register("make")} />
        </Field>
        <Field label="Model" error={form.formState.errors.model?.message}>
          <Input {...form.register("model")} />
        </Field>
        <Field label="Variant" error={form.formState.errors.variant?.message}>
          <Input {...form.register("variant")} />
        </Field>
        <Field label="Year" error={form.formState.errors.year?.message}>
          <Input
            type="number"
            min="1886"
            max="9999"
            {...form.register("year")}
          />
        </Field>
        <Field
          label="Status"
          required
          error={form.formState.errors.status?.message}
        >
          <select
            className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm"
            {...form.register("status")}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SOLD">Sold</option>
            <option value="SCRAPPED">Scrapped</option>
          </select>
        </Field>
      </div>
      <Field label="Notes" error={form.formState.errors.notes?.message}>
        <textarea
          className="min-h-20 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("notes")}
        />
      </Field>
      <Button className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {vehicle ? "Save changes" : "Add vehicle"}
      </Button>
    </form>
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
        <span className="block text-xs font-normal text-red-600">{error}</span>
      )}
    </label>
  );
}

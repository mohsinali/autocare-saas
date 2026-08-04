"use client";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from "../appointment-schema";
import {
  branchLocalToApi,
  formatBusinessTime,
  todayInTimezone,
} from "../appointment-date-utils";
import { useCreateAppointment } from "../appointment-hooks";
import {
  useAppointmentVehicles,
  useBranches,
  useCustomerSearch,
} from "../reference-hooks";

export function AppointmentForm({
  lockedCustomerId,
  returnTo,
}: {
  lockedCustomerId?: string;
  returnTo?: string;
}): React.JSX.Element {
  const router = useRouter();
  const [customerSearch, setCustomerSearch] = useState("");
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      branchId: "",
      customerId: lockedCustomerId ?? "",
      vehicleId: "",
      date: "",
      time: "",
      estimatedDurationMinutes: 60,
      serviceRequested: "",
      notes: "",
    },
  });
  const customerId = form.watch("customerId");
  const branchId = form.watch("branchId");
  const branches = useBranches();
  const customers = useCustomerSearch(customerSearch);
  const vehicles = useAppointmentVehicles(customerId);
  const mutation = useCreateAppointment();
  const branch = branches.data?.data.find((item) => item.id === branchId);
  const availableVehicles = useMemo(
    () =>
      vehicles.data?.data.filter((vehicle) => vehicle.status === "ACTIVE") ??
      [],
    [vehicles.data],
  );
  useEffect(() => {
    const selected = form.getValues("vehicleId");
    if (
      selected &&
      !availableVehicles.some((vehicle) => vehicle.id === selected)
    )
      form.setValue("vehicleId", "");
  }, [availableVehicles, form]);
  function submit(values: AppointmentFormValues): void {
    if (!branch) return;
    let appointmentDateTime: string;
    try {
      appointmentDateTime = branchLocalToApi(
        values.date,
        values.time,
        branch.timezone,
      );
    } catch {
      form.setError("time", {
        message: "This local time is invalid in the branch timezone.",
      });
      return;
    }
    mutation.mutate(
      {
        branchId: values.branchId,
        vehicleId: values.vehicleId,
        appointmentDateTime,
        estimatedDurationMinutes: values.estimatedDurationMinutes,
        serviceRequested: values.serviceRequested,
        notes: values.notes || undefined,
      },
      {
        onSuccess: (created) =>
          router.push(returnTo ?? `/appointments/${created.id}`),
        onError: (error) => {
          const message = axios.isAxiosError<{ message?: string | string[] }>(
            error,
          )
            ? error.response?.data.message
            : undefined;
          form.setError("root", {
            message: Array.isArray(message)
              ? message.join(". ")
              : (message ?? "Unable to schedule this appointment."),
          });
        },
      },
    );
  }
  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Branch" error={form.formState.errors.branchId?.message}>
          <select
            className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm"
            {...form.register("branchId")}
          >
            <option value="">Select branch</option>
            {branches.data?.data
              .filter((item) => item.isActive)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </Field>
        <Field
          label="Estimated duration (minutes)"
          error={form.formState.errors.estimatedDurationMinutes?.message}
        >
          <Input
            type="number"
            min={1}
            max={1440}
            {...form.register("estimatedDurationMinutes")}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Customer"
          description={
            lockedCustomerId
              ? "Customer is fixed from this workspace."
              : "Search, then select a customer."
          }
          error={form.formState.errors.customerId?.message}
        >
          {!lockedCustomerId && (
            <div className="relative mb-2">
              <Search className="absolute left-3 top-3 size-4 text-slate-400" />
              <Input
                className="pl-9"
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder="Search customers"
              />
            </div>
          )}
          <select
            disabled={Boolean(lockedCustomerId)}
            className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm disabled:opacity-60"
            {...form.register("customerId")}
          >
            <option value="">Select customer</option>
            {customers.data?.data.map((item) => (
              <option key={item.id} value={item.id}>
                {item.firstName} {item.lastName} · {item.phone}
              </option>
            ))}
            {lockedCustomerId &&
              !customers.data?.data.some(
                (item) => item.id === lockedCustomerId,
              ) && <option value={lockedCustomerId}>Selected customer</option>}
          </select>
        </Field>
        <Field
          label="Vehicle"
          description={
            !customerId
              ? "Select a customer first."
              : availableVehicles.length === 0 && !vehicles.isLoading
                ? "This customer has no active vehicles."
                : undefined
          }
          error={form.formState.errors.vehicleId?.message}
        >
          <select
            disabled={
              !customerId ||
              vehicles.isLoading ||
              availableVehicles.length === 0
            }
            className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm disabled:opacity-60"
            {...form.register("vehicleId")}
          >
            <option value="">
              {vehicles.isLoading ? "Loading vehicles…" : "Select vehicle"}
            </option>
            {availableVehicles.map((item) => (
              <option key={item.id} value={item.id}>
                {[item.year, item.make, item.model].filter(Boolean).join(" ") ||
                  item.vehicleCode}
                {item.registrationNumber ? ` · ${item.registrationNumber}` : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Appointment date"
          error={form.formState.errors.date?.message}
        >
          <Input
            type="date"
            min={branch ? todayInTimezone(branch.timezone) : undefined}
            {...form.register("date")}
          />
        </Field>
        <Field
          label="Appointment time"
          error={form.formState.errors.time?.message}
        >
          <Input type="time" {...form.register("time")} />
        </Field>
      </div>
      {branch && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
          Times are shown in {branch.timezone}. Branch hours:{" "}
          {formatBusinessTime(branch.businessOpeningTime)}–
          {formatBusinessTime(branch.businessClosingTime)}. The server validates
          final availability.
        </p>
      )}
      <Field
        label="Requested service"
        error={form.formState.errors.serviceRequested?.message}
      >
        <textarea
          className="min-h-24 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("serviceRequested")}
        />
      </Field>
      <Field
        label="Notes"
        description="Optional internal scheduling notes."
        error={form.formState.errors.notes?.message}
      >
        <textarea
          className="min-h-20 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("notes")}
        />
      </Field>
      {form.formState.errors.root?.message && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {form.formState.errors.root.message}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Schedule appointment
        </Button>
      </div>
    </form>
  );
}
function Field({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description?: string | false;
  error?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {description && (
        <span className="block text-xs font-normal text-slate-500">
          {description}
        </span>
      )}
      {error && (
        <span role="alert" className="block text-xs font-normal text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

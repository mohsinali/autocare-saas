"use client";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BranchSelect } from "@/components/common/branch-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomer } from "@/features/customers/customer-hooks";
import type { Customer, Vehicle } from "@/types";
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
import { useAppointmentVehicles, useBranches } from "../reference-hooks";
import { CustomerSearchCombobox } from "./customer-search-combobox";
import { CustomerVehicleCombobox } from "./customer-vehicle-combobox";
import { QuickCreateCustomerDialog } from "./quick-create-customer-dialog";
import { QuickCreateVehicleDialog } from "./quick-create-vehicle-dialog";

export function AppointmentForm({
  lockedCustomerId,
  returnTo,
}: {
  lockedCustomerId?: string;
  returnTo?: string;
}): React.JSX.Element {
  const router = useRouter();
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [customerCreateSearch, setCustomerCreateSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>();
  const [createdVehicle, setCreatedVehicle] = useState<Vehicle>();
  const vehicleButtonRef = useRef<HTMLButtonElement>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
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
  const lockedCustomer = useCustomer(lockedCustomerId ?? "");
  const vehicles = useAppointmentVehicles(customerId);
  const mutation = useCreateAppointment();
  const dateField = form.register("date");
  const branch = branches.data?.data.find((item) => item.id === branchId);
  const availableVehicles = useMemo(() => {
    const items =
      vehicles.data?.data.filter((vehicle) => vehicle.status === "ACTIVE") ??
      [];
    return createdVehicle?.customerId === customerId &&
      !items.some((vehicle) => vehicle.id === createdVehicle.id)
      ? [createdVehicle, ...items]
      : items;
  }, [createdVehicle, customerId, vehicles.data]);
  useEffect(() => {
    if (lockedCustomer.data) setSelectedCustomer(lockedCustomer.data);
  }, [lockedCustomer.data]);
  useEffect(() => {
    const selected = form.getValues("vehicleId");
    if (
      selected &&
      !availableVehicles.some((vehicle) => vehicle.id === selected)
    )
      form.setValue("vehicleId", "");
  }, [availableVehicles, form]);
  function selectCustomer(customer: Customer): void {
    setSelectedCustomer(customer);
    setCreatedVehicle(undefined);
    form.setValue("customerId", customer.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("vehicleId", "", {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
  }
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
    <>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Branch" error={form.formState.errors.branchId?.message}>
            <Controller
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <BranchSelect
                  value={field.value}
                  onChange={field.onChange}
                  invalid={Boolean(form.formState.errors.branchId)}
                />
              )}
            />
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
            <CustomerSearchCombobox
              value={customerId}
              selectedCustomer={selectedCustomer}
              disabled={Boolean(lockedCustomerId)}
              invalid={Boolean(form.formState.errors.customerId)}
              onChange={selectCustomer}
              onCreate={(search) => {
                setCustomerCreateSearch(search);
                setCustomerDialogOpen(true);
              }}
            />
          </Field>
          <Field
            label="Vehicle"
            description={
              !customerId
                ? "Select a customer first."
                : availableVehicles.length === 0 && !vehicles.isLoading
                  ? "No vehicles found for this customer."
                  : undefined
            }
            error={form.formState.errors.vehicleId?.message}
          >
            <CustomerVehicleCombobox
              ref={vehicleButtonRef}
              customerId={customerId}
              value={form.watch("vehicleId")}
              vehicles={availableVehicles}
              loading={vehicles.isLoading}
              error={vehicles.isError}
              invalid={Boolean(form.formState.errors.vehicleId)}
              onChange={(vehicle) =>
                form.setValue("vehicleId", vehicle.id, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onCreate={() => setVehicleDialogOpen(true)}
            />
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
              {...dateField}
              ref={(element) => {
                dateField.ref(element);
                dateInputRef.current = element;
              }}
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
            {formatBusinessTime(branch.businessClosingTime)}. The server
            validates final availability.
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
      <QuickCreateCustomerDialog
        open={customerDialogOpen}
        initialSearch={customerCreateSearch}
        onOpenChange={setCustomerDialogOpen}
        onCreated={(customer) => {
          selectCustomer(customer);
          window.requestAnimationFrame(() => vehicleButtonRef.current?.focus());
        }}
      />
      <QuickCreateVehicleDialog
        open={vehicleDialogOpen}
        customerId={customerId}
        onOpenChange={setVehicleDialogOpen}
        onCreated={(vehicle) => {
          setCreatedVehicle(vehicle);
          form.setValue("vehicleId", vehicle.id, {
            shouldDirty: true,
            shouldValidate: true,
          });
          window.requestAnimationFrame(() => dateInputRef.current?.focus());
        }}
      />
    </>
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

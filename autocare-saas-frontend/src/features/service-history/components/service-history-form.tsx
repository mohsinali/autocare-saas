"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { BranchSelect } from "@/components/common/branch-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  branchLocalToApi,
  todayInTimezone,
} from "@/features/appointments/appointment-date-utils";
import { useAppointments } from "@/features/appointments/appointment-hooks";
import { useBranches } from "@/features/appointments/reference-hooks";
import { useCustomers } from "@/features/customers/customer-hooks";
import { useVehicles } from "@/features/vehicles/vehicle-hooks";
import { useCreateServiceHistory } from "../service-history-hooks";
import {
  initialLineItemsForPayload,
  InitialLineItemCreationError,
} from "../service-history-create";
import { serviceHistoryErrorMessage } from "../service-history-error";
import {
  lineItemSchema,
  serviceHistorySchema,
  type ServiceHistoryFormValues,
} from "../service-history-schema";
import type { ServiceLineItemInput } from "@/services/api/service-history.service";

export function ServiceHistoryForm({
  defaults = {},
  returnTo,
}: {
  defaults?: Partial<ServiceHistoryFormValues>;
  returnTo?: string;
}): React.JSX.Element {
  const router = useRouter();
  const mutation = useCreateServiceHistory();
  const [includeLineItem, setIncludeLineItem] = useState(false);
  const [createdDraftId, setCreatedDraftId] = useState<string>();
  const [lineItemErrors, setLineItemErrors] = useState<
    Partial<Record<keyof ServiceLineItemInput, string>>
  >({});
  const [initialLineItem, setInitialLineItem] = useState<ServiceLineItemInput>({
    type: "SERVICE",
    description: "",
    quantity: "1",
    unitPrice: "0.00",
    notes: "",
  });
  const form = useForm<ServiceHistoryFormValues>({
    resolver: zodResolver(serviceHistorySchema),
    defaultValues: {
      branchId: defaults.branchId ?? "",
      customerId: defaults.customerId ?? "",
      vehicleId: defaults.vehicleId ?? "",
      appointmentId: defaults.appointmentId ?? "",
      date: defaults.date ?? "",
      time: defaults.time ?? "09:00",
      mileageAtService: defaults.mileageAtService ?? "",
      initialRequest: defaults.initialRequest ?? "",
      customerComplaint: "",
      diagnosis: "",
      workSummary: "",
      recommendations: "",
      internalNotes: "",
    },
  });
  const branchId = form.watch("branchId");
  const customerId = form.watch("customerId");
  const vehicleId = form.watch("vehicleId");
  const branches = useBranches();
  const customers = useCustomers({ page: 1, limit: 100 });
  const vehicles = useVehicles({
    page: 1,
    limit: 100,
    customerId: customerId || undefined,
  });
  const appointments = useAppointments({
    page: 1,
    limit: 100,
    branchId: branchId || undefined,
    customerId: customerId || undefined,
    vehicleId: vehicleId || undefined,
    sortBy: "appointmentDateTimeUtc",
    sortOrder: "desc",
  });
  const branch = branches.data?.data.find((item) => item.id === branchId);
  useEffect(() => {
    if (!form.getValues("date") && branch)
      form.setValue("date", todayInTimezone(branch.timezone));
  }, [branch, form]);
  useEffect(() => {
    if (!vehicles.data) return;
    const selected = vehicles.data?.data.find(
      (item) => item.id === form.getValues("vehicleId"),
    );
    if (form.getValues("vehicleId") && !selected) {
      form.setValue("vehicleId", "");
      form.setValue("appointmentId", "");
    }
  }, [customerId, vehicles.data, form]);
  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => {
        if (!branch)
          return form.setError("branchId", { message: "Select a branch" });
        const parsedLineItem = includeLineItem
          ? lineItemSchema.safeParse(initialLineItem)
          : undefined;
        if (parsedLineItem && !parsedLineItem.success) {
          const errors: Partial<Record<keyof ServiceLineItemInput, string>> =
            {};
          for (const issue of parsedLineItem.error.issues) {
            const field = issue.path[0] as keyof ServiceLineItemInput;
            errors[field] ??= issue.message;
          }
          setLineItemErrors(errors);
          return;
        }
        setLineItemErrors({});
        mutation.mutate(
          {
            branchId: values.branchId,
            customerId: values.customerId,
            vehicleId: values.vehicleId,
            appointmentId: values.appointmentId || undefined,
            visitDate: branchLocalToApi(
              values.date,
              values.time,
              branch.timezone,
            ),
            mileageAtService:
              values.mileageAtService === ""
                ? undefined
                : Number(values.mileageAtService),
            initialRequest: values.initialRequest,
            customerComplaint: values.customerComplaint || undefined,
            diagnosis: values.diagnosis || undefined,
            workSummary: values.workSummary || undefined,
            recommendations: values.recommendations || undefined,
            internalNotes: values.internalNotes || undefined,
            lineItems: initialLineItemsForPayload(
              includeLineItem,
              initialLineItem,
            ),
          },
          {
            onSuccess: (item) => router.push(`/service-history/${item.id}`),
            onError: (error) => {
              if (error instanceof InitialLineItemCreationError) {
                setCreatedDraftId(error.serviceHistory.id);
                form.setError("root", {
                  message: `${error.message} ${serviceHistoryErrorMessage(error.cause)}`,
                });
              } else
                form.setError("root", {
                  message: serviceHistoryErrorMessage(error),
                });
            },
          },
        );
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Branch" error={form.formState.errors.branchId?.message}>
          <BranchSelect
            value={branchId}
            onChange={(value) => {
              form.setValue("branchId", value, { shouldValidate: true });
              form.setValue("appointmentId", "");
            }}
            invalid={Boolean(form.formState.errors.branchId)}
          />
        </Field>
        <Field
          label="Customer"
          error={form.formState.errors.customerId?.message}
        >
          <select
            className={selectClass}
            value={customerId}
            onChange={(event) => {
              form.setValue("customerId", event.target.value, {
                shouldValidate: true,
              });
              form.setValue("vehicleId", "");
              form.setValue("appointmentId", "");
            }}
          >
            <option value="">Select customer</option>
            {customers.data?.data.map((item) => (
              <option key={item.id} value={item.id}>
                {item.firstName} {item.lastName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Vehicle" error={form.formState.errors.vehicleId?.message}>
          <select
            className={selectClass}
            value={vehicleId}
            disabled={!customerId || vehicles.isLoading}
            onChange={(event) => {
              form.setValue("vehicleId", event.target.value, {
                shouldValidate: true,
              });
              form.setValue("appointmentId", "");
            }}
          >
            <option value="">Select vehicle</option>
            {vehicles.data?.data.map((item) => (
              <option key={item.id} value={item.id}>
                {[
                  item.registrationNumber ?? item.vehicleCode,
                  item.make,
                  item.model,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Appointment (optional)">
          <select
            className={selectClass}
            disabled={!branchId || !vehicleId}
            {...form.register("appointmentId")}
          >
            <option value="">Walk-in / no appointment</option>
            {appointments.data?.data.map((item) => (
              <option key={item.id} value={item.id}>
                {item.serviceRequested} ·{" "}
                {new Date(item.appointmentDateTimeUtc).toLocaleDateString()}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={`Visit date${branch ? ` (${branch.timezone})` : ""}`}
          error={form.formState.errors.date?.message}
        >
          <Input type="date" {...form.register("date")} />
        </Field>
        <Field label="Visit time" error={form.formState.errors.time?.message}>
          <Input type="time" {...form.register("time")} />
        </Field>
        <Field
          label="Mileage at service (optional)"
          error={form.formState.errors.mileageAtService?.message}
        >
          <Input type="number" min="0" {...form.register("mileageAtService")} />
        </Field>
      </div>
      <Field
        label="Initial request"
        error={form.formState.errors.initialRequest?.message}
      >
        <textarea
          className={textareaClass}
          {...form.register("initialRequest")}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextArea
          label="Customer complaint"
          name="customerComplaint"
          form={form}
        />
        <TextArea label="Diagnosis" name="diagnosis" form={form} />
        <TextArea label="Work summary" name="workSummary" form={form} />
        <TextArea label="Recommendations" name="recommendations" form={form} />
      </div>
      <TextArea label="Internal notes" name="internalNotes" form={form} />
      <div className="rounded-xl border p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={includeLineItem}
            onChange={(event) => {
              const checked = event.target.checked;
              setIncludeLineItem(checked);
              setLineItemErrors({});
              if (!checked)
                setInitialLineItem({
                  type: "SERVICE",
                  description: "",
                  quantity: "1",
                  unitPrice: "0.00",
                  notes: "",
                });
            }}
          />
          Add an initial line item
        </label>
        {includeLineItem && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select
                className={selectClass}
                value={initialLineItem.type}
                onChange={(event) =>
                  setInitialLineItem((current) => ({
                    ...current,
                    type: event.target.value as ServiceLineItemInput["type"],
                  }))
                }
              >
                {(["SERVICE", "PART", "LABOR", "OTHER"] as const).map(
                  (type) => (
                    <option key={type}>{type}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Description" error={lineItemErrors.description}>
              <Input
                value={initialLineItem.description}
                onChange={(event) =>
                  setInitialLineItem((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Quantity" error={lineItemErrors.quantity}>
              <Input
                inputMode="decimal"
                value={initialLineItem.quantity}
                onChange={(event) =>
                  setInitialLineItem((current) => ({
                    ...current,
                    quantity: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Unit price" error={lineItemErrors.unitPrice}>
              <Input
                inputMode="decimal"
                value={initialLineItem.unitPrice}
                onChange={(event) =>
                  setInitialLineItem((current) => ({
                    ...current,
                    unitPrice: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
        )}
      </div>
      {form.formState.errors.root?.message && (
        <p role="alert" className="text-sm text-red-600">
          {form.formState.errors.root.message}
        </p>
      )}
      {createdDraftId && (
        <Link
          className="inline-flex text-sm font-medium text-blue-600 hover:underline"
          href={`/service-history/${createdDraftId}`}
        >
          Open the created draft and add the line item manually
        </Link>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(returnTo ?? "/service-history")}
        >
          Cancel
        </Button>
        <Button disabled={mutation.isPending || Boolean(createdDraftId)}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Create active job
        </Button>
      </div>
    </form>
  );
}
const selectClass =
  "h-10 w-full rounded-lg border bg-transparent px-3 text-sm disabled:opacity-60";
const textareaClass =
  "min-h-24 w-full rounded-lg border bg-transparent p-3 text-sm";
type TextName =
  | "customerComplaint"
  | "diagnosis"
  | "workSummary"
  | "recommendations"
  | "internalNotes";
function TextArea({
  label,
  name,
  form,
}: {
  label: string;
  name: TextName;
  form: ReturnType<typeof useForm<ServiceHistoryFormValues>>;
}): React.JSX.Element {
  return (
    <Field label={label} error={form.formState.errors[name]?.message}>
      <textarea className={textareaClass} {...form.register(name)} />
    </Field>
  );
}
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error && (
        <span role="alert" className="block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

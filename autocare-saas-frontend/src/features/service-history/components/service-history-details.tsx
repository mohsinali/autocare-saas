"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatAppointmentDateTime } from "@/features/appointments/appointment-date-utils";
import { useTenantCurrency } from "@/features/settings/settings-hooks";
import { formatDate } from "@/lib/utils";
import {
  completionSchema,
  lineItemSchema,
  type LineItemFormValues,
} from "../service-history-schema";
import { Field } from "./service-history-form";
import { StatusBadge } from "./service-history-workspace";
import {
  useCancelServiceHistory,
  useCompleteServiceHistory,
  useCreateServiceLineItem,
  useDeleteServiceLineItem,
  useServiceHistory,
  useUpdateServiceHistory,
  useUpdateServiceLineItem,
} from "../service-history-hooks";
import type { ServiceHistory, ServiceLineItem } from "@/types";
import {
  canCancelServiceHistory,
  canEditServiceHistory,
} from "../service-history-status";
import {
  formatServiceHistorySubtotal,
  formatServiceLineItemAmounts,
} from "../service-history-currency";
import { useCreateInvoice } from "@/features/invoices/invoice-hooks";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { formatCurrency } from "@/lib/currency";

export function ServiceHistoryDetails({
  id,
}: {
  id: string;
}): React.JSX.Element {
  const query = useServiceHistory(id);
  const router = useRouter();
  const currencyCode = useTenantCurrency();
  const [edit, setEdit] = useState(false);
  const [lineItem, setLineItem] = useState<
    ServiceLineItem | null | undefined
  >();
  const [complete, setComplete] = useState(false);
  const [cancel, setCancel] = useState(false);
  if (query.isLoading) return <LoadingState rows={7} />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        title="Service record not found"
        description="It may have been removed or you may not have access."
        onRetry={() => void query.refetch()}
      />
    );
  const item = query.data;
  const editable = canEditServiceHistory(item.status);
  return (
    <div className="space-y-6">
      <Link
        href="/service-history"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="size-4" />
        Back to Service History
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusBadge status={item.status} />
          <h1 className="mt-3 text-2xl font-bold">
            {item.customer.firstName} {item.customer.lastName} ·{" "}
            {vehicleName(item)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {item.branch.name} ·{" "}
            {formatAppointmentDateTime(item.visitDate, item.branch.timezone)} ·{" "}
            {item.branch.timezone}
          </p>
        </div>
        {editable && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEdit(true)}>
              <Pencil className="size-4" />
              Edit Job Details
            </Button>
            <Button onClick={() => setComplete(true)}>
              <CheckCircle2 className="size-4" />
              Complete Service
            </Button>
            <Button
              variant="outline"
              disabled={
                !canCancelServiceHistory(item.status, item.lineItems.length)
              }
              title={
                item.lineItems.length
                  ? "Remove all active line items before cancellation"
                  : undefined
              }
              onClick={() => setCancel(true)}
            >
              <XCircle className="size-4" />
              Cancel Job
            </Button>
          </div>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <h2 className="font-semibold">Service line items</h2>
              <p className="text-sm text-slate-500">
                Services, parts, labor, and other recorded work.
              </p>
            </div>
            {editable && (
              <Button size="sm" onClick={() => setLineItem(null)}>
                <Plus className="size-4" />
                Add Line Item
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {item.lineItems.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="border-b text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-3">Type / Description</th>
                      <th>Qty</th>
                      <th>Unit price</th>
                      <th>Total</th>
                      {editable && <th className="text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {item.lineItems.map((line) => (
                      <LineRow
                        key={line.id}
                        line={line}
                        editable={editable}
                        onEdit={() => setLineItem(line)}
                        historyId={item.id}
                        currencyCode={currencyCode}
                      />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-semibold">
                      <td className="py-4" colSpan={3}>
                        Subtotal
                      </td>
                      <td>
                        {formatServiceHistorySubtotal(
                          item.subtotal,
                          currencyCode,
                        )}
                      </td>
                      {editable && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="font-medium">No services or parts recorded yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Add the first line item as work is identified.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Job information</h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <Detail label="Initial request" value={item.initialRequest} />
              <Detail
                label="Mileage"
                value={item.mileageAtService?.toLocaleString() ?? "Not entered"}
              />
              <Detail
                label="Customer complaint"
                value={item.customerComplaint}
              />
              <Detail label="Diagnosis" value={item.diagnosis} />
              <Detail label="Work summary" value={item.workSummary} />
              <Detail label="Recommendations" value={item.recommendations} />
              <Detail label="Internal notes" value={item.internalNotes} />
              <Detail label="Last updated" value={formatDate(item.updatedAt)} />
              {item.status === "COMPLETED" && (
                <>
                  <Detail
                    label="Completed"
                    value={
                      item.completedAt ? formatDate(item.completedAt) : null
                    }
                  />
                  <Detail label="Completed by" value={person(item.completer)} />
                </>
              )}
              {item.status === "CANCELLED" && (
                <>
                  <Detail
                    label="Cancelled"
                    value={
                      item.cancelledAt ? formatDate(item.cancelledAt) : null
                    }
                  />
                  <Detail label="Cancelled by" value={person(item.canceller)} />
                  <Detail label="Reason" value={item.cancellationReason} />
                </>
              )}
            </dl>
            {item.status === "COMPLETED" && (
              <ServiceInvoice
                item={item}
                currencyCode={currencyCode}
                onOpen={(invoiceId) => router.push(`/invoices/${invoiceId}`)}
              />
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent>
          <h2 className="text-lg font-semibold">Edit job details</h2>
          <EditJobForm item={item} onDone={() => setEdit(false)} />
        </DialogContent>
      </Dialog>
      <Dialog
        open={lineItem !== undefined}
        onOpenChange={(open) => {
          if (!open) setLineItem(undefined);
        }}
      >
        <DialogContent>
          <h2 className="text-lg font-semibold">
            {lineItem ? "Edit line item" : "Add line item"}
          </h2>
          <p className="text-sm text-slate-500">
            Amounts are stored as decimal values. Tax and invoice fields are
            intentionally separate.
          </p>
          <LineItemForm
            historyId={item.id}
            item={lineItem ?? undefined}
            onDone={() => setLineItem(undefined)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={complete} onOpenChange={setComplete}>
        <DialogContent>
          <CompleteDialog
            item={item}
            currencyCode={currencyCode}
            onDone={() => setComplete(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={cancel} onOpenChange={setCancel}>
        <DialogContent>
          <CancelDialog item={item} onDone={() => setCancel(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
function ServiceInvoice({
  item,
  currencyCode,
  onOpen,
}: {
  item: ServiceHistory;
  currencyCode: string;
  onOpen: (id: string) => void;
}): React.JSX.Element {
  const create = useCreateInvoice();
  return (
    <div className="mt-6 rounded-lg border p-4">
      <h3 className="font-semibold">Invoice</h3>
      {item.invoice ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{item.invoice.invoiceNumber}</p>
              <p className="text-sm text-slate-500">
                Total {formatCurrency(item.invoice.totalAmount, currencyCode)}
              </p>
            </div>
            <InvoiceStatusBadge status={item.invoice.status} />
          </div>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => onOpen(item.invoice!.id)}
          >
            View Invoice
          </Button>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-slate-500">
            No invoice has been created for this service.
          </p>
          <Button
            className="mt-3 w-full"
            disabled={create.isPending}
            onClick={() => {
              if (
                window.confirm(
                  "Create a draft invoice from this completed service?",
                )
              )
                create.mutate(item.id, {
                  onSuccess: (invoice) => onOpen(invoice.id),
                });
            }}
          >
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            Create Invoice
          </Button>
        </div>
      )}
    </div>
  );
}
function LineRow({
  line,
  editable,
  onEdit,
  historyId,
  currencyCode,
}: {
  line: ServiceLineItem;
  editable: boolean;
  onEdit: () => void;
  historyId: string;
  currencyCode: string;
}): React.JSX.Element {
  const remove = useDeleteServiceLineItem(historyId);
  const amounts = formatServiceLineItemAmounts(line, currencyCode);
  return (
    <tr className="border-b last:border-0">
      <td className="py-4">
        <span className="text-xs font-medium text-blue-600">{line.type}</span>
        <p className="font-medium">{line.description}</p>
        {line.notes && <p className="text-xs text-slate-500">{line.notes}</p>}
      </td>
      <td>{line.quantity}</td>
      <td>{amounts.unitPrice}</td>
      <td className="font-medium">{amounts.lineTotal}</td>
      {editable && (
        <td>
          <div className="flex justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Edit ${line.description}`}
              onClick={onEdit}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Delete ${line.description}`}
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Remove ${line.description}?`))
                  remove.mutate(line.id);
              }}
            >
              <Trash2 className="size-4 text-red-600" />
            </Button>
          </div>
        </td>
      )}
    </tr>
  );
}
function LineItemForm({
  historyId,
  item,
  onDone,
}: {
  historyId: string;
  item?: ServiceLineItem;
  onDone: () => void;
}): React.JSX.Element {
  const create = useCreateServiceLineItem(historyId);
  const update = useUpdateServiceLineItem(historyId);
  const form = useForm<LineItemFormValues>({
    resolver: zodResolver(lineItemSchema),
    defaultValues: {
      type: item?.type ?? "SERVICE",
      description: item?.description ?? "",
      quantity: item?.quantity ?? "1",
      unitPrice: item?.unitPrice ?? "0.00",
      notes: item?.notes ?? "",
    },
  });
  const pending = create.isPending || update.isPending;
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={form.handleSubmit((values) => {
        const options = { onSuccess: onDone };
        if (item)
          update.mutate({ lineItemId: item.id, input: values }, options);
        else create.mutate(values, options);
      })}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select
            className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm"
            {...form.register("type")}
          >
            {["SERVICE", "PART", "LABOR", "OTHER"].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </Field>
        <Field label="Quantity" error={form.formState.errors.quantity?.message}>
          <Input inputMode="decimal" {...form.register("quantity")} />
        </Field>
      </div>
      <Field
        label="Description"
        error={form.formState.errors.description?.message}
      >
        <Input {...form.register("description")} />
      </Field>
      <Field
        label="Unit price"
        error={form.formState.errors.unitPrice?.message}
      >
        <Input inputMode="decimal" {...form.register("unitPrice")} />
      </Field>
      <Field label="Notes">
        <textarea
          className="min-h-20 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("notes")}
        />
      </Field>
      <Button className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {item ? "Save line item" : "Add line item"}
      </Button>
    </form>
  );
}
function EditJobForm({
  item,
  onDone,
}: {
  item: ServiceHistory;
  onDone: () => void;
}): React.JSX.Element {
  const mutation = useUpdateServiceHistory(item.id);
  const form = useForm({
    defaultValues: {
      mileageAtService: item.mileageAtService?.toString() ?? "",
      initialRequest: item.initialRequest,
      customerComplaint: item.customerComplaint ?? "",
      diagnosis: item.diagnosis ?? "",
      workSummary: item.workSummary ?? "",
      recommendations: item.recommendations ?? "",
      internalNotes: item.internalNotes ?? "",
    },
  });
  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={form.handleSubmit((values) =>
        mutation.mutate(
          {
            ...values,
            mileageAtService:
              values.mileageAtService === ""
                ? undefined
                : Number(values.mileageAtService),
          },
          { onSuccess: onDone },
        ),
      )}
    >
      <Field label="Mileage">
        <Input type="number" min="0" {...form.register("mileageAtService")} />
      </Field>
      <Field label="Initial request">
        <textarea
          required
          className="min-h-20 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("initialRequest")}
        />
      </Field>
      {(
        [
          "customerComplaint",
          "diagnosis",
          "workSummary",
          "recommendations",
          "internalNotes",
        ] as const
      ).map((name) => (
        <Field key={name} label={name.replace(/([A-Z])/g, " $1")}>
          <textarea
            className="min-h-16 w-full rounded-lg border bg-transparent p-3 text-sm"
            {...form.register(name)}
          />
        </Field>
      ))}
      <Button className="w-full" disabled={mutation.isPending}>
        Save job details
      </Button>
    </form>
  );
}
function CompleteDialog({
  item,
  currencyCode,
  onDone,
}: {
  item: ServiceHistory;
  currencyCode: string;
  onDone: () => void;
}): React.JSX.Element {
  const mutation = useCompleteServiceHistory(item.id);
  const form = useForm({
    resolver: zodResolver(completionSchema),
    defaultValues: {
      mileageAtService:
        item.mileageAtService ?? item.vehicle?.currentMileage ?? 0,
      workSummary: item.workSummary ?? "",
      recommendations: item.recommendations ?? "",
    },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        if (
          item.vehicle &&
          values.mileageAtService < item.vehicle.currentMileage
        )
          return form.setError("mileageAtService", {
            message: `Mileage cannot be below ${item.vehicle.currentMileage.toLocaleString()}`,
          });
        mutation.mutate(values, { onSuccess: onDone });
      })}
    >
      <h2 className="text-lg font-semibold">Complete service?</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        This makes the record read-only, locks {item.lineItems.length} line
        items, and updates the vehicle mileage. It cannot currently be undone.
      </p>
      <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
        <p>
          {item.customer.firstName} {item.customer.lastName} ·{" "}
          {vehicleName(item)}
        </p>
        <p className="mt-1 font-semibold">
          Subtotal {formatServiceHistorySubtotal(item.subtotal, currencyCode)}
        </p>
        <p className="text-slate-500">
          Current vehicle mileage:{" "}
          {item.vehicle?.currentMileage.toLocaleString() ?? "Unavailable"}
        </p>
      </div>
      <Field
        label="Mileage at service"
        error={form.formState.errors.mileageAtService?.message}
      >
        <Input type="number" min="0" {...form.register("mileageAtService")} />
      </Field>
      <Field label="Work summary">
        <textarea
          className="min-h-20 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("workSummary")}
        />
      </Field>
      <Field label="Recommendations">
        <textarea
          className="min-h-20 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("recommendations")}
        />
      </Field>
      <Button className="w-full" disabled={mutation.isPending}>
        Complete service
      </Button>
    </form>
  );
}
function CancelDialog({
  item,
  onDone,
}: {
  item: ServiceHistory;
  onDone: () => void;
}): React.JSX.Element {
  const mutation = useCancelServiceHistory(item.id);
  const form = useForm({ defaultValues: { reason: "" } });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        mutation.mutate(values.reason || undefined, { onSuccess: onDone }),
      )}
    >
      <h2 className="text-lg font-semibold">Cancel job?</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        The job becomes read-only and vehicle mileage will not be updated.
        Cancellation is only available because no active line items exist.
      </p>
      <Field label="Reason (optional)">
        <textarea
          className="min-h-20 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("reason")}
        />
      </Field>
      <Button
        variant="destructive"
        className="w-full"
        disabled={mutation.isPending}
      >
        Cancel job
      </Button>
    </form>
  );
}
function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}): React.JSX.Element {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap font-medium">{value || "—"}</dd>
    </div>
  );
}
function person(value: { firstName: string; lastName: string } | null): string {
  return value ? `${value.firstName} ${value.lastName}` : "—";
}
function vehicleName(item: ServiceHistory): string {
  return item.vehicle
    ? [
        item.vehicle.registrationNumber ?? item.vehicle.vehicleCode,
        item.vehicle.make,
        item.vehicle.model,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Legacy vehicle";
}

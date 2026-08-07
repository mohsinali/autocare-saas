"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTenantCurrency } from "@/features/settings/settings-hooks";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import type { Invoice, InvoiceLineItem } from "@/types";
import {
  useAddInvoiceLineItem,
  useDeleteInvoice,
  useDeleteInvoiceLineItem,
  useInvoice,
  useInvoiceAction,
  useUpdateInvoice,
  useUpdateInvoiceLineItem,
} from "../invoice-hooks";
import {
  invoiceEditSchema,
  invoiceLineSchema,
  type InvoiceEditValues,
  type InvoiceLineValues,
} from "../invoice-schema";
import { InvoiceStatusBadge } from "./invoice-status-badge";

export function InvoiceDetail({ id }: { id: string }): React.JSX.Element {
  const query = useInvoice(id);
  const router = useRouter();
  const currency = useTenantCurrency();
  const [edit, setEdit] = useState(false);
  const [line, setLine] = useState<InvoiceLineItem | null | undefined>();
  if (query.isLoading) return <LoadingState rows={7} />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        title="Invoice not found"
        description="It may have been removed or you may not have access."
        onRetry={() => void query.refetch()}
      />
    );
  const invoice = query.data;
  const draft = invoice.status === "DRAFT";
  return (
    <div className="space-y-6">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="size-4" />
        Back to invoices
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <InvoiceStatusBadge status={invoice.status} />
          <h1 className="mt-3 text-2xl font-bold">
            Invoice {invoice.invoiceNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Created {formatDate(invoice.createdAt)}
          </p>
        </div>
        <InvoiceActions
          invoice={invoice}
          onDeleted={() =>
            router.push(`/service-history/${invoice.serviceHistoryId}`)
          }
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Summary title="Customer">
          <Link
            href={`/customers/${invoice.customer.id}`}
            className="font-semibold text-blue-600 hover:underline"
          >
            {invoice.customer.firstName} {invoice.customer.lastName}
          </Link>
          <p>{invoice.customer.phone}</p>
          <p>{invoice.customer.email ?? "—"}</p>
        </Summary>
        <Summary title="Vehicle">
          <p className="font-semibold">
            {[invoice.vehicle.year, invoice.vehicle.make, invoice.vehicle.model]
              .filter(Boolean)
              .join(" ") || invoice.vehicle.vehicleCode}
          </p>
          <p>{invoice.vehicle.registrationNumber ?? "No registration"}</p>
        </Summary>
        <Summary title="Branch">
          <p className="font-semibold">{invoice.branch.name}</p>
          <p>{invoice.branch.timezone}</p>
        </Summary>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <h2 className="font-semibold">Invoice details</h2>
            <p className="text-sm text-slate-500">
              Dates, tax label, discount, and notes.
            </p>
          </div>
          {draft && (
            <Button size="sm" variant="outline" onClick={() => setEdit(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Detail
            label="Issue date"
            value={invoice.issueDate ? formatDate(invoice.issueDate) : "—"}
          />
          <Detail
            label="Due date"
            value={invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
          />
          <Detail
            label="Paid"
            value={invoice.paidAt ? formatDate(invoice.paidAt) : "—"}
          />
          <div>
            <p className="text-slate-500">Service History</p>
            <Link
              className="mt-1 inline-block font-medium text-blue-600 hover:underline"
              href={`/service-history/${invoice.serviceHistoryId}`}
            >
              {formatDate(invoice.serviceHistory.visitDate)} · View record
            </Link>
          </div>
          <Detail label="Tax label" value={invoice.taxLabel ?? "—"} />
          <Detail label="Notes" value={invoice.notes ?? "—"} />
          <Detail label="Internal notes" value={invoice.internalNotes ?? "—"} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <h2 className="font-semibold">Line items</h2>
            <p className="text-sm text-slate-500">
              Backend-calculated amounts are shown below.
            </p>
          </div>
          {draft && (
            <Button size="sm" onClick={() => setLine(null)}>
              <Plus className="size-4" />
              Add Line Item
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {invoice.lineItems.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3">Description</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Unit price</th>
                    <th>Tax %</th>
                    <th>Tax</th>
                    <th>Total</th>
                    {draft && <th className="text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item) => (
                    <LineRow
                      key={item.id}
                      item={item}
                      invoiceId={id}
                      currency={currency}
                      editable={draft}
                      onEdit={() => setLine(item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">No invoice line items</p>
              <p className="mt-1 text-sm text-slate-500">
                Add at least one item before issuing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="ml-auto max-w-md space-y-3 p-6 text-sm">
          <TotalRow
            label="Subtotal"
            value={formatCurrency(invoice.subtotal, currency)}
          />
          <TotalRow
            label={invoice.taxLabel || "Tax"}
            value={formatCurrency(invoice.taxAmount, currency)}
          />
          <TotalRow
            label="Discount"
            value={`−${formatCurrency(invoice.discountAmount, currency)}`}
          />
          <div className="border-t pt-3">
            <TotalRow
              strong
              label="Total"
              value={formatCurrency(invoice.totalAmount, currency)}
            />
          </div>
        </CardContent>
      </Card>
      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent>
          <h2 className="text-lg font-semibold">Edit invoice</h2>
          <InvoiceEditForm invoice={invoice} onDone={() => setEdit(false)} />
        </DialogContent>
      </Dialog>
      <Dialog
        open={line !== undefined}
        onOpenChange={(open) => {
          if (!open) setLine(undefined);
        }}
      >
        <DialogContent>
          <h2 className="text-lg font-semibold">
            {line ? "Edit line item" : "Add line item"}
          </h2>
          <InvoiceLineForm
            invoiceId={id}
            item={line ?? undefined}
            onDone={() => setLine(undefined)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceActions({
  invoice,
  onDeleted,
}: {
  invoice: Invoice;
  onDeleted: () => void;
}): React.JSX.Element {
  const actions = useInvoiceAction(invoice.id, invoice.serviceHistoryId);
  const remove = useDeleteInvoice(invoice.id, invoice.serviceHistoryId);
  const pending =
    actions.issue.isPending ||
    actions.markPaid.isPending ||
    actions.voidInvoice.isPending ||
    remove.isPending;
  return (
    <div className="flex flex-wrap gap-2">
      {invoice.status === "DRAFT" && (
        <>
          <Button
            disabled={pending || !invoice.lineItems.length}
            onClick={() => {
              if (
                window.confirm(
                  "Issue this invoice? Once issued, it can no longer be edited.",
                )
              )
                actions.issue.mutate();
            }}
          >
            Issue Invoice
          </Button>
          {/* <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  `Void invoice ${invoice.invoiceNumber}? It will remain for historical reference.`,
                )
              )
                actions.voidInvoice.mutate();
            }}
          >
            Void Invoice
          </Button> */}
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  `Permanently delete draft invoice ${invoice.invoiceNumber}?`,
                )
              )
                remove.mutate(undefined, { onSuccess: onDeleted });
            }}
          >
            Delete Invoice
          </Button>
        </>
      )}
      {invoice.status === "ISSUED" && (
        <>
          <Button
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  "Mark this invoice as paid? No payment transaction will be created.",
                )
              )
                actions.markPaid.mutate();
            }}
          >
            Mark as Paid
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  `Void invoice ${invoice.invoiceNumber}? It will remain for historical reference.`,
                )
              )
                actions.voidInvoice.mutate();
            }}
          >
            Void Invoice
          </Button>
        </>
      )}
    </div>
  );
}
function InvoiceEditForm({
  invoice,
  onDone,
}: {
  invoice: Invoice;
  onDone: () => void;
}): React.JSX.Element {
  const mutation = useUpdateInvoice(invoice.id, invoice.serviceHistoryId);
  const form = useForm<InvoiceEditValues>({
    resolver: zodResolver(invoiceEditSchema),
    defaultValues: {
      dueDate: invoice.dueDate?.slice(0, 10) ?? "",
      taxLabel: invoice.taxLabel ?? "",
      discountAmount: invoice.discountAmount,
      notes: invoice.notes ?? "",
      internalNotes: invoice.internalNotes ?? "",
    },
  });
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={form.handleSubmit((values) =>
        mutation.mutate(
          { ...values, dueDate: values.dueDate || undefined },
          { onSuccess: onDone },
        ),
      )}
    >
      <Field label="Due date" error={form.formState.errors.dueDate?.message}>
        <Input type="date" {...form.register("dueDate")} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Tax label"
          error={form.formState.errors.taxLabel?.message}
        >
          <Input
            placeholder="GST, VAT, Sales Tax"
            {...form.register("taxLabel")}
          />
        </Field>
        <Field
          label="Fixed discount"
          error={form.formState.errors.discountAmount?.message}
        >
          <Input inputMode="decimal" {...form.register("discountAmount")} />
        </Field>
      </div>
      <Field label="Notes" error={form.formState.errors.notes?.message}>
        <textarea
          className="min-h-20 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("notes")}
        />
      </Field>
      <Field
        label="Internal notes"
        error={form.formState.errors.internalNotes?.message}
      >
        <textarea
          className="min-h-20 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("internalNotes")}
        />
      </Field>
      <Button className="w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}Save
        invoice
      </Button>
    </form>
  );
}
function InvoiceLineForm({
  invoiceId,
  item,
  onDone,
}: {
  invoiceId: string;
  item?: InvoiceLineItem;
  onDone: () => void;
}): React.JSX.Element {
  const create = useAddInvoiceLineItem(invoiceId);
  const update = useUpdateInvoiceLineItem(invoiceId);
  const form = useForm<InvoiceLineValues>({
    resolver: zodResolver(invoiceLineSchema),
    defaultValues: {
      type: item?.type ?? "SERVICE",
      description: item?.description ?? "",
      quantity: item?.quantity ?? "1",
      unitPrice: item?.unitPrice ?? "0.00",
      taxRate: item?.taxRate ?? "0",
    },
  });
  const pending = create.isPending || update.isPending;
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={form.handleSubmit((values) =>
        item
          ? update.mutate(
              { lineId: item.id, input: values },
              { onSuccess: onDone },
            )
          : create.mutate(values, { onSuccess: onDone }),
      )}
    >
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
      <Field
        label="Description"
        error={form.formState.errors.description?.message}
      >
        <Input {...form.register("description")} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Quantity" error={form.formState.errors.quantity?.message}>
          <Input inputMode="decimal" {...form.register("quantity")} />
        </Field>
        <Field
          label="Unit price"
          error={form.formState.errors.unitPrice?.message}
        >
          <Input inputMode="decimal" {...form.register("unitPrice")} />
        </Field>
        <Field
          label="Tax rate %"
          error={form.formState.errors.taxRate?.message}
        >
          <Input inputMode="decimal" {...form.register("taxRate")} />
        </Field>
      </div>
      <Button className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {item ? "Save line item" : "Add line item"}
      </Button>
    </form>
  );
}
function LineRow({
  item,
  invoiceId,
  currency,
  editable,
  onEdit,
}: {
  item: InvoiceLineItem;
  invoiceId: string;
  currency: string;
  editable: boolean;
  onEdit: () => void;
}): React.JSX.Element {
  const remove = useDeleteInvoiceLineItem(invoiceId);
  return (
    <tr className="border-b last:border-0">
      <td className="py-4 font-medium">{item.description}</td>
      <td>{item.type ?? "—"}</td>
      <td>{item.quantity}</td>
      <td>{formatCurrency(item.unitPrice, currency)}</td>
      <td>{item.taxRate}%</td>
      <td>{formatCurrency(item.taxAmount, currency)}</td>
      <td className="font-medium">
        {formatCurrency(item.lineTotal, currency)}
      </td>
      {editable && (
        <td>
          <div className="flex justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Edit ${item.description}`}
              onClick={onEdit}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Delete ${item.description}`}
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Delete line item “${item.description}”?`))
                  remove.mutate(item.id);
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
function Summary({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">{title}</h2>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
        {children}
      </CardContent>
    </Card>
  );
}
function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-medium whitespace-pre-wrap">{value}</p>
    </div>
  );
}
function TotalRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}): React.JSX.Element {
  return (
    <div
      className={`flex justify-between gap-6 ${strong ? "text-lg font-bold" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}

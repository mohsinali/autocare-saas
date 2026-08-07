"use client";
import { FileText, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranches } from "@/features/appointments/reference-hooks";
import { useTenantCurrency } from "@/features/settings/settings-hooks";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import type { InvoiceStatus } from "@/types";
import { useInvoices } from "../invoice-hooks";
import { InvoiceStatusBadge } from "./invoice-status-badge";

export function InvoiceList({
  customerId,
  compact = false,
}: {
  customerId?: string;
  compact?: boolean;
}): React.JSX.Element {
  const params = useSearchParams();
  const router = useRouter();
  const currency = useTenantCurrency();
  const branches = useBranches();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const status = (params.get("status") || undefined) as
    InvoiceStatus | undefined;
  const query = useInvoices({
    page,
    limit: compact ? 5 : 10,
    customerId,
    status,
    branchId: params.get("branch") || undefined,
    search: params.get("search") || undefined,
  });
  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    if (!("page" in changes)) next.delete("page");
    router.replace(`?${next}`);
  };
  return (
    <div className="space-y-6">
      {!compact && (
        <PageHeader
          title="Invoices"
          description="Review draft, issued, paid, and void invoices. Invoices are created from completed Service History records."
        />
      )}
      {compact && (
        <div>
          <h2 className="text-lg font-semibold">Invoices</h2>
          <p className="text-sm text-slate-500">Invoices for this customer.</p>
        </div>
      )}
      {!compact && (
        <Card>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
            <label className="relative">
              <span className="sr-only">Search invoices</span>
              <Search className="absolute left-3 top-3 size-4 text-slate-400" />
              <Input
                className="pl-9"
                defaultValue={params.get("search") ?? ""}
                placeholder="Invoice or customer"
                onKeyDown={(event) => {
                  if (event.key === "Enter")
                    update({ search: event.currentTarget.value || undefined });
                }}
              />
            </label>
            <select
              aria-label="Invoice status"
              value={status ?? ""}
              onChange={(event) =>
                update({ status: event.target.value || undefined })
              }
              className="h-10 rounded-lg border bg-transparent px-3 text-sm"
            >
              <option value="">All statuses</option>
              {["DRAFT", "ISSUED", "PAID", "VOID"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <select
              aria-label="Branch"
              value={params.get("branch") ?? ""}
              onChange={(event) =>
                update({ branch: event.target.value || undefined })
              }
              className="h-10 rounded-lg border bg-transparent px-3 text-sm"
            >
              <option value="">All branches</option>
              {branches.data?.data.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}
      {query.isLoading ? (
        <LoadingState rows={5} />
      ) : query.isError ? (
        <ErrorState
          title="Couldn’t load invoices"
          onRetry={() => void query.refetch()}
        />
      ) : query.data?.data.length ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Invoice</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Branch</th>
                  <th>Issue date</th>
                  <th>Status</th>
                  <th className="pr-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <td className="p-4">
                      <Link
                        className="font-semibold text-blue-600 hover:underline"
                        href={`/invoices/${invoice.id}`}
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td>
                      {invoice.customer.firstName} {invoice.customer.lastName}
                    </td>
                    <td>
                      {[
                        invoice.vehicle.year,
                        invoice.vehicle.make,
                        invoice.vehicle.model,
                      ]
                        .filter(Boolean)
                        .join(" ") || invoice.vehicle.vehicleCode}
                    </td>
                    <td>{invoice.branch.name}</td>
                    <td>
                      {invoice.issueDate ? formatDate(invoice.issueDate) : "—"}
                    </td>
                    <td>
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="pr-4 text-right font-semibold">
                      {formatCurrency(invoice.totalAmount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="grid place-items-center p-10 text-center">
            <FileText className="size-8 text-slate-400" />
            <h3 className="mt-3 font-semibold">No invoices found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Create an invoice from a completed Service History record.
            </p>
          </CardContent>
        </Card>
      )}
      {(query.data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => update({ page: String(page - 1) })}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            Page {page} of {query.data?.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= (query.data?.totalPages ?? 1)}
            onClick={() => update({ page: String(page + 1) })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

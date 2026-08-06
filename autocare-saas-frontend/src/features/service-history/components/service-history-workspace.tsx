"use client";
import { ArrowRight, Plus, Search, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatAppointmentDateTime } from "@/features/appointments/appointment-date-utils";
import { useBranches } from "@/features/appointments/reference-hooks";
import { useTenantCurrency } from "@/features/settings/settings-hooks";
import { formatDate } from "@/lib/utils";
import { formatServiceHistorySubtotal } from "../service-history-currency";
import { useServiceHistories } from "../service-history-hooks";
import type { ServiceHistoryStatus } from "@/types";

const tabs: { value: string; label: string; status?: ServiceHistoryStatus }[] =
  [
    { value: "active", label: "Active Jobs", status: "DRAFT" },
    { value: "completed", label: "Completed", status: "COMPLETED" },
    { value: "cancelled", label: "Cancelled", status: "CANCELLED" },
    { value: "all", label: "All" },
  ];
export function ServiceHistoryWorkspace({
  lockedCustomerId,
  lockedVehicleId,
  compact = false,
}: {
  lockedCustomerId?: string;
  lockedVehicleId?: string;
  compact?: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") ?? "active";
  const selectedTab = tabs.find((item) => item.value === tab) ?? tabs[0];
  const page = Math.max(1, Number(params.get("page")) || 1);
  const search = params.get("search") ?? "";
  const branchId = params.get("branch") ?? "";
  const branches = useBranches();
  const currencyCode = useTenantCurrency();
  const query = useServiceHistories({
    page,
    limit: compact ? 5 : 10,
    customerId: lockedCustomerId,
    vehicleId: lockedVehicleId,
    branchId: branchId || undefined,
    status: selectedTab.status,
    search: search || undefined,
    visitDateFrom: params.get("from") || undefined,
    visitDateTo: params.get("to") || undefined,
    sortBy: selectedTab.status === "DRAFT" ? "updatedAt" : "visitDate",
    sortOrder: "desc",
  });
  function update(changes: Record<string, string | undefined>): void {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    if (!("page" in changes)) next.delete("page");
    router.replace(`?${next.toString()}`);
  }
  const createHref = `/service-history/new?${new URLSearchParams({ ...(lockedCustomerId ? { customerId: lockedCustomerId } : {}), ...(lockedVehicleId ? { vehicleId: lockedVehicleId } : {}), returnTo: lockedCustomerId ? `/customers/${lockedCustomerId}?tab=service-history` : "/service-history" }).toString()}`;
  return (
    <div className="space-y-6">
      {!compact && (
        <PageHeader
          title="Service History"
          description="Manage active workshop jobs and completed vehicle service records."
          action={
            <Link href={createHref}>
              <Button>
                <Plus className="size-4" />
                New Service Record
              </Button>
            </Link>
          }
        />
      )}
      {compact && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Service History</h2>
            <p className="text-sm text-slate-500">
              Active and completed records for this customer.
            </p>
          </div>
          <Link href={createHref}>
            <Button size="sm">
              <Plus className="size-4" />
              New Service Record
            </Button>
          </Link>
        </div>
      )}
      <div
        role="tablist"
        aria-label="Service record status"
        className="flex gap-1 overflow-x-auto border-b"
      >
        {tabs.map((item) => (
          <button
            key={item.value}
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => update({ tab: item.value })}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${tab === item.value ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {!compact && (
        <Card>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="relative">
              <span className="sr-only">Search service records</span>
              <Search className="absolute left-3 top-3 size-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search jobs"
                defaultValue={search}
                onKeyDown={(event) => {
                  if (event.key === "Enter")
                    update({ search: event.currentTarget.value || undefined });
                }}
              />
            </label>
            <select
              aria-label="Branch"
              value={branchId}
              onChange={(event) =>
                update({ branch: event.target.value || undefined })
              }
              className="h-10 rounded-lg border bg-transparent px-3 text-sm"
            >
              <option value="">All branches</option>
              {branches.data?.data.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Input
              aria-label="Visit date from"
              type="date"
              value={params.get("from") ?? ""}
              onChange={(event) =>
                update({ from: event.target.value || undefined })
              }
            />
            <Input
              aria-label="Visit date to"
              type="date"
              value={params.get("to") ?? ""}
              onChange={(event) =>
                update({ to: event.target.value || undefined })
              }
            />
          </CardContent>
        </Card>
      )}
      {query.isLoading ? (
        <LoadingState rows={compact ? 3 : 6} />
      ) : query.isError ? (
        <ErrorState
          title="Couldn’t load service records"
          onRetry={() => void query.refetch()}
        />
      ) : query.data?.data.length ? (
        <div className="grid gap-3">
          {query.data.data.map((item) => (
            <Link
              key={item.id}
              href={`/service-history/${item.id}`}
              className="group rounded-xl border bg-white p-4 shadow-sm transition-colors hover:border-blue-300 dark:bg-slate-900 dark:hover:border-blue-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-slate-500">
                      Updated {formatDate(item.updatedAt)}
                    </span>
                  </div>
                  <h3 className="mt-2 truncate font-semibold">
                    {item.customer.firstName} {item.customer.lastName} ·{" "}
                    {vehicleName(item)}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {item.initialRequest}
                  </p>
                </div>
                <ArrowRight className="mt-2 size-4 shrink-0 text-slate-400 group-hover:text-blue-600" />
              </div>
              <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-4">
                <span>
                  {formatAppointmentDateTime(
                    item.visitDate,
                    item.branch.timezone,
                  )}
                </span>
                <span>{item.branch.name}</span>
                <span>
                  {item.lineItems.length} line item
                  {item.lineItems.length === 1 ? "" : "s"}
                </span>
                <span
                  className={
                    item.status === "CANCELLED"
                      ? "line-through"
                      : "font-medium text-slate-800 dark:text-slate-200"
                  }
                >
                  {item.status === "CANCELLED"
                    ? "No charge"
                    : formatServiceHistorySubtotal(item.subtotal, currencyCode)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="grid place-items-center p-10 text-center">
            <Wrench className="size-8 text-slate-400" />
            <h3 className="mt-3 font-semibold">
              {selectedTab.status === "DRAFT"
                ? "No active workshop jobs"
                : selectedTab.status === "COMPLETED"
                  ? "No completed services yet"
                  : "No service records found"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {selectedTab.status === "DRAFT"
                ? "Create a service record when a vehicle arrives."
                : "Records matching this view will appear here."}
            </p>
            {selectedTab.status === "DRAFT" && (
              <Link className="mt-4" href={createHref}>
                <Button size="sm">New Service Record</Button>
              </Link>
            )}
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
export function StatusBadge({
  status,
}: {
  status: ServiceHistoryStatus;
}): React.JSX.Element {
  const styles =
    status === "DRAFT"
      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
      : status === "COMPLETED"
        ? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {status === "DRAFT"
        ? "Active Job"
        : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
function vehicleName(item: {
  vehicle: {
    registrationNumber: string | null;
    vehicleCode: string;
    make: string | null;
    model: string | null;
  } | null;
}): string {
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

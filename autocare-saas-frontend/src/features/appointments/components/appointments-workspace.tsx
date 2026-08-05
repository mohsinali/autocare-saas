"use client";
import { CalendarDays, List, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCustomers } from "@/features/customers/customer-hooks";
import { useVehicles } from "@/features/vehicles/vehicle-hooks";
import { useAppointments } from "../appointment-hooks";
import { useBranches } from "../reference-hooks";
import { AppointmentCard } from "./appointment-card";
import type { AppointmentStatus } from "@/types";
import type { AppointmentFilters } from "@/services/api/appointments.service";

const statuses: AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_SERVICE",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

function positivePage(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function utcBoundary(date: string, endOfDay = false): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const value = `${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
  return Number.isNaN(Date.parse(value)) ? undefined : value;
}

export function AppointmentsWorkspace(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branches = useBranches();
  const customers = useCustomers({ page: 1, limit: 100 });
  const customerId = searchParams.get("customer") ?? "";
  const vehicles = useVehicles({
    page: 1,
    limit: 100,
    customerId: customerId || undefined,
  });
  const page = positivePage(searchParams.get("page"));
  const view = searchParams.get("view") === "schedule" ? "schedule" : "list";
  const branchId = searchParams.get("branch") ?? "";
  const vehicleId = searchParams.get("vehicle") ?? "";
  const search = searchParams.get("search") ?? "";
  const serviceType = searchParams.get("serviceType") ?? "";
  const statusValue = searchParams.get("status") ?? "";
  const status = statuses.includes(statusValue as AppointmentStatus)
    ? (statusValue as AppointmentStatus)
    : undefined;
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const datePreset = searchParams.get("range");
  const sortByValue = searchParams.get("sortBy");
  const sortBy: AppointmentFilters["sortBy"] = [
    "appointmentDateTimeUtc",
    "createdAt",
    "updatedAt",
    "status",
  ].includes(sortByValue ?? "")
    ? (sortByValue as AppointmentFilters["sortBy"])
    : "appointmentDateTimeUtc";
  const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
  const filters: AppointmentFilters = {
    page,
    limit: 10,
    branchId: branchId || undefined,
    customerId: customerId || undefined,
    vehicleId: vehicleId || undefined,
    status,
    search: search || undefined,
    serviceType: serviceType || undefined,
    startDate: datePreset ? undefined : utcBoundary(startDate),
    endDate: datePreset ? undefined : utcBoundary(endDate, true),
    today: datePreset === "today" || undefined,
    tomorrow: datePreset === "tomorrow" || undefined,
    upcoming: datePreset === "upcoming" || undefined,
    sortBy,
    sortOrder,
  };
  const appointments = useAppointments(filters);

  function updateParams(changes: Record<string, string | undefined>): void {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in changes)) next.delete("page");
    router.replace(
      next.size ? `/appointments?${next.toString()}` : "/appointments",
    );
  }

  function setCustomer(value: string): void {
    const selectedVehicle = vehicles.data?.data.find(
      (item) => item.id === vehicleId,
    );
    updateParams({
      customer: value || undefined,
      vehicle:
        value && selectedVehicle?.customerId === value ? vehicleId : undefined,
    });
  }

  function setDatePreset(value?: string): void {
    updateParams({ range: value, startDate: undefined, endDate: undefined });
  }

  const hasFilters = Boolean(
    branchId ||
    customerId ||
    vehicleId ||
    status ||
    search ||
    serviceType ||
    startDate ||
    endDate ||
    datePreset,
  );
  const availableVehicles = customerId
    ? (vehicles.data?.data.filter((item) => item.customerId === customerId) ??
      [])
    : (vehicles.data?.data ?? []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Coordinate branch schedules and customer visits."
        action={
          <Link href="/appointments/new">
            <Button>
              <Plus className="size-4" />
              New appointment
            </Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <select
              aria-label="Branch"
              value={branchId}
              onChange={(event) =>
                updateParams({ branch: event.target.value || undefined })
              }
              className="h-10 rounded-lg border bg-transparent px-3 text-sm"
            >
              <option value="">All branches</option>
              {branches.data?.data
                .filter((item) => item.isActive)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
            <select
              aria-label="Customer"
              value={customerId}
              onChange={(event) => setCustomer(event.target.value)}
              className="h-10 rounded-lg border bg-transparent px-3 text-sm"
            >
              <option value="">All customers</option>
              {customers.data?.data.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.firstName} {item.lastName}
                </option>
              ))}
            </select>
            <select
              aria-label="Vehicle"
              value={vehicleId}
              onChange={(event) =>
                updateParams({ vehicle: event.target.value || undefined })
              }
              disabled={vehicles.isLoading || availableVehicles.length === 0}
              className="h-10 rounded-lg border bg-transparent px-3 text-sm disabled:opacity-60"
            >
              <option value="">All vehicles</option>
              {availableVehicles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.registrationNumber ?? item.vehicleCode}
                </option>
              ))}
            </select>
            <select
              aria-label="Status"
              value={status ?? ""}
              onChange={(event) =>
                updateParams({ status: event.target.value || undefined })
              }
              className="h-10 rounded-lg border bg-transparent px-3 text-sm"
            >
              <option value="">All statuses</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SearchInput
              label="Search appointments"
              placeholder="Search service or notes"
              value={search}
              onCommit={(value) => updateParams({ search: value || undefined })}
            />
            <SearchInput
              label="Service requested"
              placeholder="Filter requested service"
              value={serviceType}
              onCommit={(value) =>
                updateParams({ serviceType: value || undefined })
              }
            />
            <Input
              aria-label="Start date"
              type="date"
              value={startDate}
              disabled={Boolean(datePreset)}
              onChange={(event) =>
                updateParams({
                  startDate: event.target.value || undefined,
                  range: undefined,
                })
              }
            />
            <Input
              aria-label="End date"
              type="date"
              value={endDate}
              disabled={Boolean(datePreset)}
              onChange={(event) =>
                updateParams({
                  endDate: event.target.value || undefined,
                  range: undefined,
                })
              }
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex flex-wrap gap-2">
              {(["today", "tomorrow", "upcoming"] as const).map((preset) => (
                <Button
                  key={preset}
                  size="sm"
                  variant={datePreset === preset ? "default" : "outline"}
                  onClick={() =>
                    setDatePreset(datePreset === preset ? undefined : preset)
                  }
                >
                  {preset[0].toUpperCase() + preset.slice(1)}
                </Button>
              ))}
              {hasFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.replace("/appointments")}
                >
                  <X className="size-3" />
                  Clear filters
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Sort appointments"
                value={sortBy}
                onChange={(event) =>
                  updateParams({ sortBy: event.target.value })
                }
                className="h-8 rounded-lg border bg-transparent px-2 text-xs"
              >
                <option value="appointmentDateTimeUtc">Appointment time</option>
                <option value="createdAt">Created</option>
                <option value="updatedAt">Updated</option>
                <option value="status">Status</option>
              </select>
              <select
                aria-label="Sort direction"
                value={sortOrder}
                onChange={(event) =>
                  updateParams({ sortOrder: event.target.value })
                }
                className="h-8 rounded-lg border bg-transparent px-2 text-xs"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <div className="flex rounded-lg border p-1">
                <button
                  aria-label="Schedule view"
                  onClick={() => updateParams({ view: "schedule" })}
                  className={`rounded-md px-3 py-1.5 ${view === "schedule" ? "bg-blue-600 text-white" : ""}`}
                >
                  <CalendarDays className="size-4" />
                </button>
                <button
                  aria-label="List view"
                  onClick={() => updateParams({ view: undefined })}
                  className={`rounded-md px-3 py-1.5 ${view === "list" ? "bg-blue-600 text-white" : ""}`}
                >
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {appointments.isLoading ? (
        <LoadingState rows={6} />
      ) : appointments.isError ? (
        <ErrorState
          title="Couldn’t load appointments"
          description="Check your connection and try again."
          onRetry={() => void appointments.refetch()}
        />
      ) : !appointments.data?.data.length ? (
        <EmptyState
          title={
            hasFilters ? "No matching appointments" : "No appointments found"
          }
          description={
            hasFilters
              ? "Try clearing or changing the active filters."
              : "Create an appointment to begin building this schedule."
          }
        />
      ) : (
        <div
          className={
            view === "schedule"
              ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3"
              : "space-y-3"
          }
        >
          {appointments.data.data.map((item) => (
            <AppointmentCard
              key={item.id}
              appointment={item}
              customer={customers.data?.data.find(
                (value) => value.id === item.customerId,
              )}
              vehicle={vehicles.data?.data.find(
                (value) => value.id === item.vehicleId,
              )}
            />
          ))}
        </div>
      )}
      {appointments.data && appointments.data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {appointments.data.page} of {appointments.data.totalPages} ·{" "}
            {appointments.data.total} appointments
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= appointments.data.totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchInput({
  label,
  placeholder,
  value,
  onCommit,
}: {
  label: string;
  placeholder: string;
  value: string;
  onCommit: (value: string) => void;
}): React.JSX.Element {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 size-4 text-slate-400" />
      <Input
        key={value}
        defaultValue={value}
        onBlur={(event) => onCommit(event.target.value.trim())}
        onKeyDown={(event) => {
          if (event.key === "Enter") onCommit(event.currentTarget.value.trim());
        }}
        className="pl-9"
        placeholder={placeholder}
        aria-label={label}
      />
    </div>
  );
}

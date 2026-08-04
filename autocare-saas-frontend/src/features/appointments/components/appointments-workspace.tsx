"use client";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { DateTime } from "luxon";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCustomers } from "@/features/customers/customer-hooks";
import { useVehicles } from "@/features/vehicles/vehicle-hooks";
import { useAppointmentCalendar, useAppointments } from "../appointment-hooks";
import {
  branchDayUtcRange,
  safeBranchTimezone,
  todayInTimezone,
} from "../appointment-date-utils";
import { useBranches } from "../reference-hooks";
import { AppointmentCard } from "./appointment-card";
import type { AppointmentStatus } from "@/types";

export function AppointmentsWorkspace(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branches = useBranches();
  const customers = useCustomers({ page: 1, limit: 100 });
  const vehicles = useVehicles({ page: 1, limit: 100 });
  const branchId =
    searchParams.get("branch") ??
    branches.data?.data.find((item) => item.isActive)?.id ??
    "";
  const branch = branches.data?.data.find((item) => item.id === branchId);
  const timezone = safeBranchTimezone(branch?.timezone);
  const requestedDate = searchParams.get("date");
  const date =
    requestedDate && DateTime.fromISO(requestedDate, { zone: timezone }).isValid
      ? requestedDate
      : todayInTimezone(timezone);
  const view = searchParams.get("view") === "list" ? "list" : "schedule";
  const page = Number(searchParams.get("page") ?? 1);
  const search = searchParams.get("search") ?? "";
  const status = (searchParams.get("status") || undefined) as
    AppointmentStatus | undefined;
  const range = useMemo(
    () => branchDayUtcRange(date, timezone),
    [date, timezone],
  );
  const calendar = useAppointmentCalendar({
    ...range,
    branchId: branchId || undefined,
  });
  const list = useAppointments({
    page,
    limit: 10,
    branchId: branchId || undefined,
    search: search || undefined,
    status,
    sortBy: "appointmentDateTimeUtc",
    sortOrder: "asc",
  });
  const query = view === "schedule" ? calendar : list;
  const appointments = view === "schedule" ? calendar.data : list.data?.data;
  function setParam(key: string, value?: string): void {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`/appointments?${next.toString()}`);
  }
  function moveDay(amount: number): void {
    setParam(
      "date",
      DateTime.fromISO(date, { zone: timezone })
        .plus({ days: amount })
        .toISODate()!,
    );
  }
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
          <div className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_minmax(220px,2fr)_minmax(160px,1fr)_auto]">
            <select
              aria-label="Branch"
              value={branchId}
              onChange={(event) => setParam("branch", event.target.value)}
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
            <div className="relative">
              <Search className="absolute left-3 top-3 size-4 text-slate-400" />
              <Input
                defaultValue={search}
                onBlur={(event) => setParam("search", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter")
                    setParam("search", event.currentTarget.value);
                }}
                className="pl-9"
                placeholder="Search service or notes"
                aria-label="Search appointments"
              />
            </div>
            <select
              aria-label="Status"
              value={status ?? ""}
              onChange={(event) => setParam("status", event.target.value)}
              className="h-10 rounded-lg border bg-transparent px-3 text-sm"
            >
              <option value="">All statuses</option>
              {[
                "SCHEDULED",
                "CONFIRMED",
                "CHECKED_IN",
                "IN_SERVICE",
                "COMPLETED",
                "CANCELLED",
                "NO_SHOW",
              ].map((item) => (
                <option key={item} value={item}>
                  {item.replace("_", " ")}
                </option>
              ))}
            </select>
            <div className="flex rounded-lg border p-1">
              <button
                aria-label="Schedule view"
                onClick={() => setParam("view", "schedule")}
                className={`rounded-md px-3 py-1.5 ${view === "schedule" ? "bg-blue-600 text-white" : ""}`}
              >
                <CalendarDays className="size-4" />
              </button>
              <button
                aria-label="List view"
                onClick={() => setParam("view", "list")}
                className={`rounded-md px-3 py-1.5 ${view === "list" ? "bg-blue-600 text-white" : ""}`}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
          {view === "schedule" && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous day"
                  onClick={() => moveDay(-1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Input
                  aria-label="Schedule date"
                  className="w-40"
                  type="date"
                  value={date}
                  onChange={(event) => setParam("date", event.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next day"
                  onClick={() => moveDay(1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <p className="text-sm text-slate-500">
                Times shown in {timezone}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {query.isLoading ? (
        <LoadingState rows={6} />
      ) : query.isError ? (
        <ErrorState
          title="Couldn’t load appointments"
          description="Check your connection and try again."
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : !appointments?.length ? (
        <EmptyState
          title={
            search || status
              ? "No matching appointments"
              : "No appointments scheduled"
          }
          description={
            search || status
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
          {appointments.map((item) => (
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
      {view === "list" && list.data && list.data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {list.data.page} of {list.data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setParam("page", String(page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= list.data.totalPages}
              onClick={() => setParam("page", String(page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

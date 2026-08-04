"use client";
import Link from "next/link";
import { CalendarClock, Clock3 } from "lucide-react";
import { useBranch } from "../reference-hooks";
import { formatAppointmentDateTime } from "../appointment-date-utils";
import { AppointmentStatusBadge } from "./appointment-status-badge";
import type { Appointment, Customer, Vehicle } from "@/types";

export function vehicleLabel(vehicle?: Vehicle): string {
  if (!vehicle) return "Vehicle unavailable";
  return (
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
    vehicle.registrationNumber ||
    vehicle.vehicleCode
  );
}
export function AppointmentCard({
  appointment,
  customer,
  vehicle,
  compact = false,
}: {
  appointment: Appointment;
  customer?: Customer;
  vehicle?: Vehicle;
  compact?: boolean;
}): React.JSX.Element {
  const branch = useBranch(appointment.branchId);
  const timezone = branch.data?.timezone ?? "UTC";
  return (
    <Link
      href={`/appointments/${appointment.id}`}
      className="block rounded-xl border bg-white p-4 transition hover:border-blue-300 hover:shadow-sm dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            {customer
              ? `${customer.firstName} ${customer.lastName}`
              : "Customer unavailable"}
          </p>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {vehicleLabel(vehicle)}
          </p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <CalendarClock className="size-4 text-blue-600" />
        <span>
          {formatAppointmentDateTime(
            appointment.appointmentDateTimeUtc,
            timezone,
          )}
        </span>
      </div>
      {!compact && (
        <>
          <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
            {appointment.serviceRequested}
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <Clock3 className="size-3.5" />
            {appointment.estimatedDurationMinutes} minutes ·{" "}
            {branch.data?.name ?? "Branch"}
          </p>
        </>
      )}
    </Link>
  );
}

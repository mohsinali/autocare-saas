"use client";
import { ArrowLeft, Building2, Car, Clock3, UserRound } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { useCustomer } from "@/features/customers/customer-hooks";
import { useAppointment } from "../appointment-hooks";
import { formatAppointmentDateTime } from "../appointment-date-utils";
import { useAppointmentVehicles, useBranch } from "../reference-hooks";
import { AppointmentActions } from "./appointment-actions";
import { AppointmentStatusBadge } from "./appointment-status-badge";
import { vehicleLabel } from "./appointment-card";

export function AppointmentDetailsView({
  appointmentId,
}: {
  appointmentId: string;
}): React.JSX.Element {
  const appointment = useAppointment(appointmentId);
  const customer = useCustomer(appointment.data?.customerId ?? "");
  const vehicles = useAppointmentVehicles(appointment.data?.customerId ?? "");
  const branch = useBranch(appointment.data?.branchId ?? "");
  if (appointment.isLoading) return <LoadingState rows={6} />;
  if (appointment.isError)
    return (
      <ErrorState
        title="Appointment not found"
        description="It may have been removed or you may not have access."
        onRetry={() => {
          void appointment.refetch();
        }}
      />
    );
  if (!appointment.data)
    return (
      <EmptyState
        title="Appointment not found"
        description="This appointment is unavailable."
      />
    );
  const item = appointment.data;
  const vehicle = vehicles.data?.data.find(
    (value) => value.id === item.vehicleId,
  );
  return (
    <div className="space-y-6">
      <Link
        href="/appointments"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="size-4" />
        Back to appointments
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2">
            <AppointmentStatusBadge status={item.status} />
          </div>
          <h1 className="text-2xl font-bold">{item.serviceRequested}</h1>
          <p className="mt-1 text-slate-500">
            Appointment #{item.id.slice(0, 8)}
          </p>
        </div>
        {branch.data && (
          <AppointmentActions
            appointment={item}
            branch={branch.data}
            customer={customer.data}
            vehicle={vehicle}
          />
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-6 p-6">
            <Detail
              icon={Clock3}
              title="Date and time"
              primary={
                branch.data
                  ? formatAppointmentDateTime(
                      item.appointmentDateTimeUtc,
                      branch.data.timezone,
                    )
                  : "Loading branch timezone…"
              }
              secondary={`${item.estimatedDurationMinutes} minutes${branch.data ? ` · ${branch.data.timezone}` : ""}`}
            />
            <Detail
              icon={UserRound}
              title="Customer"
              primary={
                customer.data
                  ? `${customer.data.firstName} ${customer.data.lastName}`
                  : "Loading customer…"
              }
              secondary={
                customer.data
                  ? [customer.data.phone, customer.data.email]
                      .filter(Boolean)
                      .join(" · ")
                  : ""
              }
            />
            <Detail
              icon={Car}
              title="Vehicle"
              primary={vehicleLabel(vehicle)}
              secondary={
                vehicle?.registrationNumber ?? vehicle?.vehicleCode ?? ""
              }
            />
            <Detail
              icon={Building2}
              title="Branch"
              primary={branch.data?.name ?? "Loading branch…"}
              secondary={
                branch.data
                  ? [
                      branch.data.addressLine1,
                      branch.data.city,
                      branch.data.stateProvince,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : ""
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
              {item.notes || "No notes added."}
            </p>
            <dl className="mt-6 space-y-4 border-t pt-5 text-sm">
              <Meta
                label="Created"
                value={new Date(item.createdAt).toLocaleDateString()}
              />
              <Meta
                label="Last updated"
                value={new Date(item.updatedAt).toLocaleDateString()}
              />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function Detail({
  icon: Icon,
  title,
  primary,
  secondary,
}: {
  icon: typeof Clock3;
  title: string;
  primary: string;
  secondary: string;
}): React.JSX.Element {
  return (
    <div className="flex gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <p className="mt-1 font-semibold">{primary}</p>
        {secondary && (
          <p className="mt-0.5 text-sm text-slate-500">{secondary}</p>
        )}
      </div>
    </div>
  );
}
function Meta({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

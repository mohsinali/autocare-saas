"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { Button } from "@/components/ui/button";
import { useVehicles } from "@/features/vehicles/vehicle-hooks";
import { useCustomerAppointments } from "../appointment-hooks";
import { AppointmentCard } from "./appointment-card";
import type { Customer } from "@/types";

export function CustomerAppointments({
  customer,
}: {
  customer: Customer;
}): React.JSX.Element {
  const appointments = useCustomerAppointments(customer.id, {
    page: 1,
    limit: 100,
    sortBy: "appointmentDateTimeUtc",
    sortOrder: "asc",
  });
  const vehicles = useVehicles({
    page: 1,
    limit: 100,
    customerId: customer.id,
  });
  if (appointments.isLoading) return <LoadingState rows={4} />;
  if (appointments.isError)
    return (
      <ErrorState
        title="Couldn’t load appointments"
        onRetry={() => {
          void appointments.refetch();
        }}
      />
    );
  const now = Date.now();
  const upcoming =
    appointments.data?.data.filter(
      (item) =>
        new Date(item.appointmentDateTimeUtc).getTime() >= now &&
        !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(item.status),
    ) ?? [];
  const past =
    appointments.data?.data.filter((item) => !upcoming.includes(item)) ?? [];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Appointments</h2>
          <p className="text-sm text-slate-500">
            Upcoming visits and appointment history.
          </p>
        </div>
        <Link
          href={`/appointments/new?customerId=${customer.id}&returnTo=/customers/${customer.id}/appointments`}
        >
          <Button>
            <Plus className="size-4" />
            Book appointment
          </Button>
        </Link>
      </div>
      {appointments.data?.data.length === 0 ? (
        <EmptyState
          title="No appointments yet"
          description="Book this customer’s first appointment."
        />
      ) : (
        <>
          <AppointmentGroup
            title="Upcoming"
            items={upcoming}
            customer={customer}
            vehicles={vehicles.data?.data}
            empty="No upcoming appointments."
          />
          <AppointmentGroup
            title="Past and inactive"
            items={past}
            customer={customer}
            vehicles={vehicles.data?.data}
            empty="No past appointments."
          />
        </>
      )}
    </div>
  );
}
function AppointmentGroup({
  title,
  items,
  customer,
  vehicles,
  empty,
}: {
  title: string;
  items: NonNullable<
    ReturnType<typeof useCustomerAppointments>["data"]
  >["data"];
  customer: Customer;
  vehicles?: import("@/types").Vehicle[];
  empty: string;
}): React.JSX.Element {
  return (
    <section>
      <h3 className="mb-3 font-semibold">{title}</h3>
      {items.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <AppointmentCard
              key={item.id}
              appointment={item}
              customer={customer}
              vehicle={vehicles?.find(
                (vehicle) => vehicle.id === item.vehicleId,
              )}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-5 text-sm text-slate-500">
          {empty}
        </p>
      )}
    </section>
  );
}

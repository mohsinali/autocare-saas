"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Car,
  Plus,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCustomers } from "@/features/customers/customer-hooks";
import { appointmentKeys } from "@/features/appointments/appointment-query-keys";
import { useVehicles } from "@/features/vehicles/vehicle-hooks";
import { formatDate } from "@/lib/utils";
import { appointmentsService } from "@/services/api/appointments.service";
import { serviceHistoryService } from "@/services/api/service-history.service";
import { serviceHistoryKeys } from "@/features/service-history/service-history-query-keys";

export default function DashboardPage(): React.JSX.Element {
  const customers = useCustomers({ page: 1, limit: 5 });
  const vehicles = useVehicles({ page: 1, limit: 1 });
  const appointments = useQuery({
    queryKey: appointmentKeys.dashboard(),
    queryFn: appointmentsService.listToday,
  });
  const activeJobs = useQuery({
    queryKey: serviceHistoryKeys.list({ page: 1, limit: 1, status: "DRAFT" }),
    queryFn: () =>
      serviceHistoryService.list({ page: 1, limit: 1, status: "DRAFT" }),
  });
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Welcome back"
        description="Here’s what’s happening across your workshop today."
        action={
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            href="/customers"
          >
            <Plus className="size-4" />
            Add customer
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Customers"
          value={customers.data?.total}
          icon={Users}
          accent="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
        />
        <Metric
          label="Active jobs"
          value={activeJobs.data?.total}
          icon={Wrench}
          accent="bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300"
        />
        <Metric
          label="Vehicles"
          value={vehicles.data?.total}
          icon={Car}
          accent="bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-300"
        />
        <Metric
          label="Today’s appointments"
          value={appointments.data?.total}
          icon={CalendarDays}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <h3 className="font-semibold">Quick actions</h3>
            <p className="text-sm text-slate-500">
              Start the tasks your team uses most.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <QuickAction
              href="/customers"
              title="Manage customers"
              description="Find a customer or add a new profile."
              icon={Users}
            />
            <QuickAction
              href="/customers"
              title="Add a vehicle"
              description="Open a customer workspace to register a vehicle."
              icon={Car}
            />
            <QuickAction
              href="/appointments/new"
              title="New Appointment"
              description="Schedule a new customer appointment."
              icon={CalendarDays}
            />
            <QuickAction
              href="/service-history/new"
              title="New Service Record"
              description="Open an active workshop job for a vehicle."
              icon={Wrench}
            />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold">Recent customers</h3>
            <p className="text-sm text-slate-500">
              Recently added customer profiles.
            </p>
          </CardHeader>
          <CardContent>
            {customers.isLoading ? (
              <LoadingState rows={4} />
            ) : customers.isError ? (
              <ErrorState
                title="Couldn’t load recent customers"
                onRetry={() => {
                  void customers.refetch();
                }}
              />
            ) : (
              <div className="space-y-2">
                {customers.data?.data.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Added {formatDate(customer.createdAt)}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-slate-400" />
                  </Link>
                ))}
                {customers.data?.data.length === 0 && (
                  <p className="py-4 text-sm text-slate-500">
                    No customers yet.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function Metric({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value?: number;
  icon: typeof Users;
  accent: string;
}): React.JSX.Element {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={`grid size-11 place-items-center rounded-xl ${accent}`}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value ?? "—"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
function QuickAction({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof Users;
}): React.JSX.Element {
  return (
    <Link
      href={href}
      className="rounded-xl border p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
    >
      <Icon className="size-5 text-blue-600" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </Link>
  );
}

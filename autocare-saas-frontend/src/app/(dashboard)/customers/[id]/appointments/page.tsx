"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { CustomerAppointments } from "@/features/appointments/components/customer-appointments";
import { useCustomer } from "@/features/customers/customer-hooks";
import { CustomerSummaryCard } from "@/features/customers/customer-summary-card";
export default function CustomerAppointmentsPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const customer = useCustomer(params.id);
  if (customer.isLoading) return <LoadingState rows={5} />;
  if (customer.isError || !customer.data)
    return (
      <ErrorState
        title="Customer not found"
        onRetry={() => {
          void customer.refetch();
        }}
      />
    );
  return (
    <div className="space-y-6">
      <Link
        href={`/customers/${params.id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="size-4" />
        Back to customer profile
      </Link>
      <CustomerSummaryCard customer={customer.data} />
      <div
        className="flex gap-5 overflow-x-auto border-b"
        role="tablist"
        aria-label="Customer workspace"
      >
        <Link
          role="tab"
          aria-selected="false"
          href={`/customers/${params.id}`}
          className="border-b-2 border-transparent px-1 pb-3 text-sm text-slate-500"
        >
          Profile
        </Link>
        <Link
          role="tab"
          aria-selected="false"
          href={`/customers/${params.id}`}
          className="border-b-2 border-transparent px-1 pb-3 text-sm text-slate-500"
        >
          Vehicles
        </Link>
        <Link
          role="tab"
          aria-selected="true"
          href={`/customers/${params.id}/appointments`}
          className="border-b-2 border-blue-600 px-1 pb-3 text-sm font-medium text-blue-600"
        >
          Appointments
        </Link>
        <span className="px-1 pb-3 text-sm text-slate-400">
          Service History
        </span>
      </div>
      <CustomerAppointments customer={customer.data} />
    </div>
  );
}

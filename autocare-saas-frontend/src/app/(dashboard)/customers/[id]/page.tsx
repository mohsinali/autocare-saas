"use client";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { SectionHeader } from "@/components/common/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CustomerForm } from "@/features/customers/customer-form";
import { useCustomer } from "@/features/customers/customer-hooks";
import { CustomerSummaryCard } from "@/features/customers/customer-summary-card";
import { VehicleDialog } from "@/features/vehicles/vehicle-dialog";
import { VehicleTable } from "@/features/vehicles/vehicle-table";
import { useVehicles } from "@/features/vehicles/vehicle-hooks";
import { formatDate } from "@/lib/utils";
type WorkspaceTab = "profile" | "vehicles" | "appointments" | "service-history";
const tabs: { id: WorkspaceTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "vehicles", label: "Vehicles" },
  { id: "appointments", label: "Appointments" },
  { id: "service-history", label: "Service History" },
];
export default function CustomerDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<WorkspaceTab>("profile");
  const [editCustomer, setEditCustomer] = useState(false);
  const [addVehicle, setAddVehicle] = useState(false);
  const customer = useCustomer(params.id);
  const vehicles = useVehicles({ page: 1, limit: 100, customerId: params.id });
  if (customer.isLoading) return <LoadingState rows={4} />;
  if (customer.isError || !customer.data)
    return (
      <ErrorState
        title="Customer not found"
        description="This customer may have been removed or you may not have access to it."
        onRetry={() => {
          void customer.refetch();
        }}
      />
    );
  const current = customer.data;
  return (
    <div className="space-y-6">
      <Link
        href="/customers"
        className="inline-flex items-center gap-2 rounded-sm text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="size-4" />
        Back to customers
      </Link>
      <CustomerSummaryCard customer={current} />
      <div className="border-b">
        <div
          role="tablist"
          aria-label="Customer workspace"
          className="flex min-w-max gap-5 overflow-x-auto"
        >
          <>
            {tabs.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => {
                  if (item.id === "appointments")
                    router.push(`/customers/${params.id}/appointments`);
                  else setTab(item.id);
                }}
                className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${tab === item.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"}`}
              >
                {item.label}
              </button>
            ))}
          </>
        </div>
      </div>
      {tab === "profile" && (
        <Card>
          <CardContent className="p-6">
            <SectionHeader
              title="Profile"
              description="Customer contact and account information."
              action={
                <Button variant="outline" onClick={() => setEditCustomer(true)}>
                  <Pencil className="size-4" />
                  Edit profile
                </Button>
              }
            />
            <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
              <Detail
                label="Customer name"
                value={`${current.firstName} ${current.lastName}`}
              />
              <Detail label="Email" value={current.email ?? "—"} />
              <Detail label="Phone" value={current.phone} />
              <Detail
                label="Created date"
                value={formatDate(current.createdAt)}
              />
              <Detail
                label="Last updated"
                value={formatDate(current.updatedAt)}
              />
            </dl>
            {current.notes && (
              <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800">
                {current.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {tab === "vehicles" && (
        <Card>
          <CardContent className="p-6">
            <SectionHeader
              title="Vehicles"
              description="Vehicles registered to this customer."
              action={
                <Button onClick={() => setAddVehicle(true)}>
                  <Plus className="size-4" />
                  Add vehicle
                </Button>
              }
            />
            <div className="mt-6">
              <VehicleTable
                customerId={current.id}
                data={vehicles.data}
                isLoading={vehicles.isLoading}
                isError={vehicles.isError}
                onRetry={() => {
                  void vehicles.refetch();
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
      {(tab === "appointments" || tab === "service-history") && (
        <EmptyState
          title={`${tab === "appointments" ? "Appointments" : "Service history"} coming soon`}
          description="This customer workspace area is being prepared for a future release."
        />
      )}
      <Dialog open={editCustomer} onOpenChange={setEditCustomer}>
        <DialogContent>
          <h2 className="mb-5 text-lg font-semibold">Edit customer profile</h2>
          <CustomerForm
            customer={current}
            onSuccess={() => setEditCustomer(false)}
          />
        </DialogContent>
      </Dialog>
      <VehicleDialog
        open={addVehicle}
        onOpenChange={setAddVehicle}
        customerId={current.id}
      />
    </div>
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
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

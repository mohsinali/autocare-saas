"use client";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { DeleteVehicleDialog } from "./delete-vehicle-dialog";
import { VehicleDialog } from "./vehicle-dialog";
import type { PaginatedVehicles, Vehicle } from "@/types";
const statusClasses = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  INACTIVE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SOLD: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  SCRAPPED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
} as const;
export function VehicleTable({
  customerId,
  data,
  isLoading,
  isError,
  onRetry,
}: {
  customerId: string;
  data?: PaginatedVehicles;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}): React.JSX.Element {
  const [editing, setEditing] = useState<Vehicle | undefined>();
  const [deleting, setDeleting] = useState<Vehicle | null>(null);
  if (isLoading) return <LoadingState rows={3} />;
  if (isError)
    return (
      <ErrorState
        title="Couldn’t load vehicles"
        description="Please refresh and try again."
        onRetry={onRetry}
      />
    );
  if (!data?.data.length)
    return (
      <EmptyState
        title="No vehicles yet"
        description="Add the customer’s first vehicle to begin managing its work."
      />
    );
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-y text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Registration</th>
              <th className="px-3 py-3">Make</th>
              <th className="px-3 py-3">Model</th>
              <th className="px-3 py-3">Variant</th>
              <th className="px-3 py-3">Year</th>
              <th className="px-3 py-3">Current mileage</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((vehicle) => (
              <tr
                key={vehicle.id}
                className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <td className="px-3 py-4 font-medium">
                  {vehicle.registrationNumber ?? vehicle.vehicleCode}
                </td>
                <td className="px-3 py-4 text-slate-500">
                  {vehicle.make ?? "—"}
                </td>
                <td className="px-3 py-4 text-slate-500">
                  {vehicle.model ?? "—"}
                </td>
                <td className="px-3 py-4 text-slate-500">
                  {vehicle.variant ?? "—"}
                </td>
                <td className="px-3 py-4 text-slate-500">
                  {vehicle.year ?? "—"}
                </td>
                <td className="px-3 py-4 text-slate-500">
                  {vehicle.currentMileage.toLocaleString()}
                </td>
                <td className="px-3 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[vehicle.status]}`}
                  >
                    {vehicle.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit ${vehicle.registrationNumber ?? vehicle.vehicleCode}`}
                      onClick={() => setEditing(vehicle)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${vehicle.registrationNumber ?? vehicle.vehicleCode}`}
                      onClick={() => setDeleting(vehicle)}
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <VehicleDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        customerId={customerId}
        vehicle={editing}
      />
      <DeleteVehicleDialog
        vehicle={deleting}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

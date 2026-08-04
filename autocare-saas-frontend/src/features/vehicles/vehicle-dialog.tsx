"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { VehicleForm } from "./vehicle-form";
import type { Vehicle } from "@/types";
export function VehicleDialog({
  open,
  onOpenChange,
  customerId,
  vehicle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  vehicle?: Vehicle;
}): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <h2 className="mb-5 text-lg font-semibold">
          {vehicle ? "Edit vehicle" : "Add vehicle"}
        </h2>
        <VehicleForm
          customerId={customerId}
          vehicle={vehicle}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

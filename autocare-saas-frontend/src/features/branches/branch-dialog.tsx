"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Branch } from "@/types";
import { BranchForm } from "./branch-form";

export function BranchDialog({
  open,
  onOpenChange,
  branch,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch;
}): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <h2 className="mb-5 text-lg font-semibold">
          {branch ? "Edit branch" : "Add branch"}
        </h2>
        <BranchForm branch={branch} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

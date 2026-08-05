"use client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Branch } from "@/types";
import { getBranchErrorMessage, useDeleteBranch } from "./branch-hooks";

export function DeleteBranchDialog({
  branch,
  onClose,
  onDeleted,
}: {
  branch: Branch | null;
  onClose: () => void;
  onDeleted?: () => void;
}): React.JSX.Element {
  const remove = useDeleteBranch();
  return (
    <Dialog open={Boolean(branch)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <h2 className="text-lg font-semibold">Remove branch?</h2>
        <p className="mt-2 text-sm text-slate-500">
          Removing{" "}
          <strong className="text-slate-700 dark:text-slate-200">
            {branch?.name}
          </strong>{" "}
          will make it unavailable for future appointment scheduling. Historical
          records are retained.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() =>
              branch &&
              remove.mutate(branch.id, {
                onSuccess: () => {
                  onClose();
                  onDeleted?.();
                },
                onError: (error) =>
                  toast.error(
                    getBranchErrorMessage(
                      error,
                      "This branch could not be removed. It may still have related records.",
                    ),
                  ),
              })
            }
          >
            {remove.isPending && <Loader2 className="size-4 animate-spin" />}
            Remove branch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";
import { ArrowUpDown, Eye, Pencil, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { Button } from "@/components/ui/button";
import type { Branch, PaginatedBranches } from "@/types";
import { branchAddress, branchTimeValue } from "./branch-utils";
import { BranchDialog } from "./branch-dialog";
import { DeleteBranchDialog } from "./delete-branch-dialog";

export function BranchTable({
  data,
  isLoading,
  isError,
  page,
  sortDirection,
  onPageChange,
  onRetry,
  onToggleSort,
}: {
  data?: PaginatedBranches;
  isLoading: boolean;
  isError: boolean;
  page: number;
  sortDirection: "asc" | "desc";
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onToggleSort: () => void;
}): React.JSX.Element {
  const [editing, setEditing] = useState<Branch>();
  const [deleting, setDeleting] = useState<Branch | null>(null);
  const branches = useMemo(
    () =>
      data?.data
        .slice()
        .sort(
          (a, b) =>
            (sortDirection === "asc" ? 1 : -1) * a.name.localeCompare(b.name),
        ) ?? [],
    [data?.data, sortDirection],
  );
  if (isLoading) return <LoadingState rows={6} />;
  if (isError)
    return (
      <ErrorState
        title="Couldn’t load branches"
        description="Branch records are unavailable right now."
        onRetry={onRetry}
      />
    );
  if (!data || branches.length === 0)
    return (
      <EmptyState
        title="No branches found"
        description="Try changing your search or add your first workshop branch."
      />
    );
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {branches.map((branch) => (
          <article key={branch.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/branches/${branch.id}`}
                  className="font-semibold hover:text-blue-600"
                >
                  {branch.name}
                </Link>
                <p className="mt-1 text-sm text-slate-500">
                  {branch.city}, {branch.stateProvince}
                </p>
              </div>
              <Status active={branch.isActive} />
            </div>
            <p className="mt-3 text-sm text-slate-500">{branch.phone}</p>
            <p className="mt-1 text-sm text-slate-500">
              {branchTimeValue(branch.businessOpeningTime)}–
              {branchTimeValue(branch.businessClosingTime)} · {branch.timezone}
            </p>
            <div className="mt-3 flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(branch)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleting(branch)}
              >
                <Trash2 className="size-4 text-red-600" />
                Remove
              </Button>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-y text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">
                <button
                  type="button"
                  onClick={onToggleSort}
                  className="inline-flex items-center gap-1 rounded-sm"
                >
                  Branch <ArrowUpDown className="size-3" />
                  <span className="sr-only">Toggle branch name sort</span>
                </button>
              </th>
              <th className="px-3 py-3">Address</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Timezone</th>
              <th className="px-3 py-3">Daily hours</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr
                key={branch.id}
                className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <td className="px-3 py-4 font-medium">
                  <Link
                    href={`/branches/${branch.id}`}
                    className="hover:text-blue-600"
                  >
                    {branch.name}
                  </Link>
                </td>
                <td className="max-w-64 px-3 py-4 text-slate-500">
                  <span className="line-clamp-2">{branchAddress(branch)}</span>
                </td>
                <td className="px-3 py-4 text-slate-500">{branch.phone}</td>
                <td className="px-3 py-4 text-slate-500">{branch.timezone}</td>
                <td className="px-3 py-4 text-slate-500">
                  {branchTimeValue(branch.businessOpeningTime)}–
                  {branchTimeValue(branch.businessClosingTime)}
                </td>
                <td className="px-3 py-4">
                  <Status active={branch.isActive} />
                </td>
                <td className="px-3 py-4">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/branches/${branch.id}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-slate-100"
                      aria-label={`View ${branch.name}`}
                    >
                      <Eye className="size-4" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit ${branch.name}`}
                      onClick={() => setEditing(branch)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove ${branch.name}`}
                      onClick={() => setDeleting(branch)}
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
      <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-slate-500">
          {data.total} branches · Page {data.page} of{" "}
          {Math.max(data.totalPages, 1)}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-3" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      <BranchDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(undefined)}
        branch={editing}
      />
      <DeleteBranchDialog branch={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function Status({ active }: { active: boolean }): React.JSX.Element {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

"use client";
import { useQuery } from "@tanstack/react-query";
import { branchQueryKeys } from "@/features/branches/branch-query-keys";
import { branchesService } from "@/services/api/branches.service";

export function BranchSelect({
  value,
  onChange,
  id,
  invalid,
  disabled,
}: {
  value: string;
  onChange: (branchId: string) => void;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
}): React.JSX.Element {
  const params = { page: 1, limit: 100 } as const;
  const query = useQuery({
    queryKey: branchQueryKeys.list(params),
    queryFn: () => branchesService.list(params),
    staleTime: 300_000,
  });
  const branches = query.data?.data.filter((branch) => branch.isActive) ?? [];
  return (
    <div className="space-y-1.5">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={
          disabled || query.isLoading || query.isError || branches.length === 0
        }
        aria-invalid={invalid}
        className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm disabled:opacity-60"
      >
        <option value="">
          {query.isLoading
            ? "Loading branches…"
            : query.isError
              ? "Branches unavailable"
              : branches.length === 0
                ? "No active branches"
                : "Select branch"}
        </option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name} · {branch.city}, {branch.stateProvince}
          </option>
        ))}
      </select>
      {query.isError && (
        <button
          type="button"
          className="text-xs text-blue-600 hover:underline"
          onClick={() => void query.refetch()}
        >
          Retry loading branches
        </button>
      )}
      {!query.isLoading && !query.isError && branches.length === 0 && (
        <p className="text-xs text-slate-500">
          Add or activate a branch before scheduling.
        </p>
      )}
    </div>
  );
}

import type { BranchListParams } from "@/services/api/branches.service";

export const branchQueryKeys = {
  all: ["branches"] as const,
  lists: () => [...branchQueryKeys.all, "list"] as const,
  list: (params: BranchListParams) =>
    [...branchQueryKeys.lists(), params] as const,
  details: () => [...branchQueryKeys.all, "detail"] as const,
  detail: (branchId: string) =>
    [...branchQueryKeys.details(), branchId] as const,
};

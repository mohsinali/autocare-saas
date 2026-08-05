"use client";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  branchesService,
  type BranchInput,
  type BranchListParams,
} from "@/services/api/branches.service";
import { branchQueryKeys } from "./branch-query-keys";

export function getBranchErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!axios.isAxiosError<{ message?: string | string[] }>(error))
    return fallback;
  const message = error.response?.data.message;
  return Array.isArray(message) ? message.join(". ") : (message ?? fallback);
}

export function useBranches(params: BranchListParams) {
  return useQuery({
    queryKey: branchQueryKeys.list(params),
    queryFn: () => branchesService.list(params),
    staleTime: 300_000,
  });
}

export function useBranch(branchId: string) {
  return useQuery({
    queryKey: branchQueryKeys.detail(branchId),
    queryFn: () => branchesService.get(branchId),
    enabled: Boolean(branchId),
    staleTime: 300_000,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BranchInput) => branchesService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: branchQueryKeys.lists() });
      toast.success("Branch added");
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BranchInput }) =>
      branchesService.update(id, input),
    onSuccess: (branch) => {
      queryClient.setQueryData(branchQueryKeys.detail(branch.id), branch);
      void queryClient.invalidateQueries({ queryKey: branchQueryKeys.lists() });
      toast.success("Branch updated");
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: branchesService.remove,
    onSuccess: (_, branchId) => {
      queryClient.removeQueries({ queryKey: branchQueryKeys.detail(branchId) });
      void queryClient.invalidateQueries({ queryKey: branchQueryKeys.lists() });
      toast.success("Branch removed");
    },
  });
}

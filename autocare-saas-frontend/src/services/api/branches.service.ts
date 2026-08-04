import { api } from "./client";
import type { Branch, PaginatedBranches } from "@/types";

export const branchesService = {
  async list(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<PaginatedBranches> {
    return (await api.get<PaginatedBranches>("/branches", { params })).data;
  },
  async get(id: string): Promise<Branch> {
    return (await api.get<Branch>(`/branches/${id}`)).data;
  },
};

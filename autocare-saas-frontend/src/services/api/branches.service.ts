import { api } from "./client";
import type { Branch, PaginatedBranches } from "@/types";

export interface BranchListParams {
  page: number;
  limit: number;
  search?: string;
}

export interface BranchInput {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  timezone: string;
  businessOpeningTime: string;
  businessClosingTime: string;
  isActive?: boolean;
}

export const branchesService = {
  async list(params: BranchListParams): Promise<PaginatedBranches> {
    return (await api.get<PaginatedBranches>("/branches", { params })).data;
  },
  async get(id: string): Promise<Branch> {
    return (await api.get<Branch>(`/branches/${id}`)).data;
  },
  async create(input: BranchInput): Promise<Branch> {
    return (await api.post<Branch>("/branches", input)).data;
  },
  async update(id: string, input: Partial<BranchInput>): Promise<Branch> {
    return (await api.patch<Branch>(`/branches/${id}`, input)).data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/branches/${id}`);
  },
};

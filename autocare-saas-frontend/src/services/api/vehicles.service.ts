import { api } from "./client";
import type { PaginatedVehicles, Vehicle, VehicleStatus } from "@/types";

export interface VehicleInput {
  customerId: string;
  nickname?: string | null;
  registrationNumber?: string | null;
  vin?: string | null;
  make?: string | null;
  model?: string | null;
  variant?: string | null;
  year?: number | null;
  color?: string | null;
  engineNumber?: string | null;
  engineSize?: string | null;
  fuelType?: Vehicle["fuelType"];
  transmission?: Vehicle["transmission"];
  purchaseDate?: string | null;
  currentMileage: number;
  lastServiceMileage?: number | null;
  status?: VehicleStatus;
  notes?: string | null;
}
export interface VehicleListParams {
  page: number;
  limit: number;
  search?: string;
  customerId?: string;
}
export const vehiclesService = {
  async list(params: VehicleListParams): Promise<PaginatedVehicles> {
    return (await api.get<PaginatedVehicles>("/vehicles", { params })).data;
  },
  async get(id: string): Promise<Vehicle> {
    return (await api.get<Vehicle>(`/vehicles/${id}`)).data;
  },
  async create(input: VehicleInput): Promise<Vehicle> {
    return (await api.post<Vehicle>("/vehicles", input)).data;
  },
  async update(id: string, input: Partial<VehicleInput>): Promise<Vehicle> {
    return (await api.patch<Vehicle>(`/vehicles/${id}`, input)).data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },
};

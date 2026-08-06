import { api } from "./client";

export interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  currencyCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantSettingsInput {
  currencyCode: string;
}

export const tenantSettingsService = {
  async get(): Promise<TenantSettings> {
    return (await api.get<TenantSettings>("/tenant/settings")).data;
  },
  async update(input: UpdateTenantSettingsInput): Promise<TenantSettings> {
    return (await api.patch<TenantSettings>("/tenant/settings", input)).data;
  },
};

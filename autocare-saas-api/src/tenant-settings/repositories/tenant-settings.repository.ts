import { Injectable } from "@nestjs/common";
import { Prisma, Tenant } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

const tenantSettingsSelect = {
  id: true,
  name: true,
  slug: true,
  currencyCode: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TenantSelect;

export type TenantSettings = Pick<
  Tenant,
  "id" | "name" | "slug" | "currencyCode" | "createdAt" | "updatedAt"
>;

@Injectable()
export class TenantSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string): Promise<TenantSettings | null> {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: tenantSettingsSelect,
    });
  }

  update(
    tenantId: string,
    data: Prisma.TenantUpdateInput,
  ): Promise<TenantSettings> {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
      select: tenantSettingsSelect,
    });
  }
}

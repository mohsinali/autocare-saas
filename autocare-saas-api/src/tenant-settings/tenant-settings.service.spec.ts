import { ForbiddenException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthenticatedUser } from "../auth/auth.types";
import { TenantSettingsRepository } from "./repositories/tenant-settings.repository";
import { TenantSettingsService } from "./tenant-settings.service";

describe("TenantSettingsService", () => {
  const repository = { findById: jest.fn(), update: jest.fn() };
  const service = new TenantSettingsService(
    repository as unknown as TenantSettingsRepository,
  );
  const admin: AuthenticatedUser = {
    id: "user-id",
    tenantId: "tenant-a",
    email: "admin@example.com",
    role: UserRole.ADMIN,
  };

  beforeEach(() => jest.clearAllMocks());

  it("returns the USD default in tenant settings", async () => {
    repository.findById.mockResolvedValue({
      id: "tenant-a",
      currencyCode: "USD",
    });
    await expect(service.findOne("tenant-a")).resolves.toEqual(
      expect.objectContaining({ currencyCode: "USD" }),
    );
  });

  it("updates the currency code from USD to EUR", async () => {
    repository.update.mockResolvedValue({
      id: "tenant-a",
      currencyCode: "EUR",
    });
    await expect(
      service.update(admin, { currencyCode: "EUR" }),
    ).resolves.toEqual(expect.objectContaining({ currencyCode: "EUR" }));
  });

  it("always scopes updates to the authenticated tenant", async () => {
    repository.update.mockResolvedValue({ currencyCode: "EUR" });
    await service.update(admin, { currencyCode: "EUR" });
    expect(repository.update).toHaveBeenCalledWith("tenant-a", {
      currencyCode: "EUR",
    });
  });

  it("rejects updates from non-administrators", () => {
    expect(() =>
      service.update(
        { ...admin, role: UserRole.SERVICE_ADVISOR },
        { currencyCode: "EUR" },
      ),
    ).toThrow(ForbiddenException);
  });
});

import { Module } from "@nestjs/common";
import { TenantSettingsRepository } from "./repositories/tenant-settings.repository";
import { TenantSettingsController } from "./tenant-settings.controller";
import { TenantSettingsService } from "./tenant-settings.service";

@Module({
  controllers: [TenantSettingsController],
  providers: [TenantSettingsService, TenantSettingsRepository],
})
export class TenantSettingsModule {}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthenticatedUser } from "../auth/auth.types";
import { UpdateTenantSettingsDto } from "./dto/update-tenant-settings.dto";
import { TenantSettingsRepository } from "./repositories/tenant-settings.repository";

@Injectable()
export class TenantSettingsService {
  constructor(private readonly repository: TenantSettingsRepository) {}

  async findOne(tenantId: string) {
    const tenant = await this.repository.findById(tenantId);
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }

  update(user: AuthenticatedUser, dto: UpdateTenantSettingsDto) {
    if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Tenant administrator access is required");
    }
    return this.repository.update(user.tenantId, dto);
  }
}

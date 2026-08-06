import { Body, Controller, Get, Patch } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { TenantSettingsDto } from "./dto/tenant-settings.dto";
import { UpdateTenantSettingsDto } from "./dto/update-tenant-settings.dto";
import { TenantSettingsService } from "./tenant-settings.service";

@ApiTags("Tenant Settings")
@ApiBearerAuth()
@Controller("tenant/settings")
export class TenantSettingsController {
  constructor(private readonly settings: TenantSettingsService) {}

  @Get()
  @ApiOperation({ summary: "Get the authenticated tenant settings" })
  @ApiOkResponse({ type: TenantSettingsDto })
  findOne(@CurrentUser() user: AuthenticatedUser) {
    return this.settings.findOne(user.tenantId);
  }

  @Patch()
  @ApiOperation({ summary: "Update the authenticated tenant settings" })
  @ApiOkResponse({ type: TenantSettingsDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTenantSettingsDto,
  ) {
    return this.settings.update(user, dto);
  }
}

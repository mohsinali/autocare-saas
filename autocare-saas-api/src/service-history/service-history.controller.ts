import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/auth.types'; import { CurrentUser } from '../common/decorators/current-user.decorator'; import { CreateServiceHistoryDto } from './dto/create-service-history.dto'; import { ServiceHistoryService } from './service-history.service';
@ApiTags('Service History') @ApiBearerAuth() @Controller('service-history')
export class ServiceHistoryController {
  constructor(private readonly history: ServiceHistoryService) {}
  @Post() @ApiOperation({ summary: 'Record a completed service' }) create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateServiceHistoryDto) { return this.history.create(user.tenantId, dto); }
  @Get('vehicle/:vehicleId') @ApiOperation({ summary: 'List service history for a vehicle' }) list(@CurrentUser() user: AuthenticatedUser, @Param('vehicleId') vehicleId: string) { return this.history.listForVehicle(user.tenantId, vehicleId); }
}

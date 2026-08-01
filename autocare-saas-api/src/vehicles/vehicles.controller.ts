import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehicles') @ApiBearerAuth() @Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}
  @Post() @ApiOperation({ summary: 'Create a vehicle for a customer' }) create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVehicleDto) { return this.vehicles.create(user.tenantId, dto); }
  @Get() @ApiOperation({ summary: 'List tenant vehicles with pagination and search' }) findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ListVehiclesDto) { return this.vehicles.findAll(user.tenantId, query); }
  @Get(':id') @ApiOperation({ summary: 'Get a vehicle' }) @ApiParam({ name: 'id', format: 'uuid' }) findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.vehicles.findOne(user.tenantId, id); }
  @Patch(':id') @ApiOperation({ summary: 'Update a vehicle' }) @ApiParam({ name: 'id', format: 'uuid' }) update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateVehicleDto) { return this.vehicles.update(user.tenantId, id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) @ApiOperation({ summary: 'Soft-delete a vehicle' }) @ApiParam({ name: 'id', format: 'uuid' }) async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> { await this.vehicles.remove(user.tenantId, id); }
}

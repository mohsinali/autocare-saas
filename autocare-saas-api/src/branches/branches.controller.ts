import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { ListBranchesDto } from './dto/list-branches.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('Branches') @ApiBearerAuth() @Controller('branches')
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}
  @Post() @ApiOperation({ summary: 'Create a workshop branch' }) create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBranchDto) { return this.branches.create(user.tenantId, dto); }
  @Get() @ApiOperation({ summary: 'List tenant branches with pagination and search' }) findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ListBranchesDto) { return this.branches.findAll(user.tenantId, query); }
  @Get(':id') @ApiOperation({ summary: 'Get a branch' }) @ApiParam({ name: 'id', format: 'uuid' }) findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.branches.findOne(user.tenantId, id); }
  @Patch(':id') @ApiOperation({ summary: 'Update a branch' }) @ApiParam({ name: 'id', format: 'uuid' }) update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateBranchDto) { return this.branches.update(user.tenantId, id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) @ApiOperation({ summary: 'Soft-delete a branch' }) @ApiParam({ name: 'id', format: 'uuid' }) async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> { await this.branches.remove(user.tenantId, id); }
}

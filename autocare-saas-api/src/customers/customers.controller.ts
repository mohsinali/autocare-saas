import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator'; import { AuthenticatedUser } from '../auth/auth.types'; import { CustomersService } from './customers.service'; import { CreateCustomerDto } from './dto/create-customer.dto'; import { ListCustomersDto } from './dto/list-customers.dto'; import { UpdateCustomerDto } from './dto/update-customer.dto';
@ApiTags('Customers') @ApiBearerAuth() @Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}
  @Post() @ApiOperation({ summary: 'Create a customer' }) create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCustomerDto) { return this.customers.create(user.tenantId, dto); }
  @Get() list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListCustomersDto) { return this.customers.findAll(user.tenantId, query); }
  @Get(':id') findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.customers.findOne(user.tenantId, id); }
  @Patch(':id') update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCustomerDto) { return this.customers.update(user.tenantId, id, dto); }
}

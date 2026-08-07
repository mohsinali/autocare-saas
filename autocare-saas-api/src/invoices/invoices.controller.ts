import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateInvoiceLineItemDto } from "./dto/create-invoice-line-item.dto";
import { InvoiceQueryDto } from "./dto/invoice-query.dto";
import { UpdateInvoiceLineItemDto } from "./dto/update-invoice-line-item.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { InvoicesService } from "./invoices.service";

@ApiTags("Invoices")
@ApiBearerAuth()
@Controller()
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Post("service-histories/:serviceHistoryId/invoice")
  @ApiOperation({
    summary: "Create a draft invoice from a completed Service History",
  })
  @ApiParam({ name: "serviceHistoryId", format: "uuid" })
  @ApiCreatedResponse({
    description: "Invoice created with snapshot line items",
  })
  @ApiConflictResponse({
    description: "An invoice already exists for the Service History",
  })
  @ApiNotFoundResponse({ description: "Service History not found" })
  createFromServiceHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param("serviceHistoryId", new ParseUUIDPipe()) id: string,
  ) {
    return this.invoices.createFromServiceHistory(user.tenantId, id);
  }

  @Get("invoices")
  @ApiOperation({ summary: "List tenant invoices with filters and pagination" })
  @ApiOkResponse({ description: "Paginated invoice summaries" })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: InvoiceQueryDto,
  ) {
    return this.invoices.findAll(user.tenantId, query);
  }

  @Get("invoices/:id")
  @ApiOperation({ summary: "Get invoice detail" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiNotFoundResponse({ description: "Invoice not found" })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.invoices.findOne(user.tenantId, id);
  }

  @Patch("invoices/:id")
  @ApiOperation({ summary: "Edit draft invoice fields" })
  @ApiConflictResponse({ description: "Only draft invoices may be edited" })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoices.update(user.tenantId, id, dto);
  }

  @Post("invoices/:invoiceId/line-items")
  @ApiOperation({ summary: "Add a line item to a draft invoice" })
  addLineItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("invoiceId", new ParseUUIDPipe()) invoiceId: string,
    @Body() dto: CreateInvoiceLineItemDto,
  ) {
    return this.invoices.addLineItem(user.tenantId, invoiceId, dto);
  }

  @Patch("invoices/:invoiceId/line-items/:lineItemId")
  @ApiOperation({ summary: "Update a draft invoice line item" })
  updateLineItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("invoiceId", new ParseUUIDPipe()) invoiceId: string,
    @Param("lineItemId", new ParseUUIDPipe()) lineItemId: string,
    @Body() dto: UpdateInvoiceLineItemDto,
  ) {
    return this.invoices.updateLineItem(
      user.tenantId,
      invoiceId,
      lineItemId,
      dto,
    );
  }

  @Delete("invoices/:invoiceId/line-items/:lineItemId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a draft invoice line item" })
  @ApiNoContentResponse()
  async deleteLineItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("invoiceId", new ParseUUIDPipe()) invoiceId: string,
    @Param("lineItemId", new ParseUUIDPipe()) lineItemId: string,
  ): Promise<void> {
    await this.invoices.deleteLineItem(user.tenantId, invoiceId, lineItemId);
  }

  @Post("invoices/:id/issue")
  @ApiOperation({ summary: "Issue a draft invoice" })
  issue(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.invoices.issue(user.tenantId, id);
  }

  @Post("invoices/:id/mark-paid")
  @ApiOperation({ summary: "Mark an issued invoice as paid manually" })
  markPaid(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.invoices.markPaid(user.tenantId, id);
  }

  @Post("invoices/:id/void")
  @ApiOperation({ summary: "Void a draft or issued invoice" })
  void(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.invoices.void(user.tenantId, id);
  }

  @Delete("invoices/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a draft invoice" })
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.invoices.remove(user.tenantId, id);
  }
}

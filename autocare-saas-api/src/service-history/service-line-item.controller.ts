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
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import {
  CreateServiceLineItemDto,
  UpdateServiceLineItemDto,
} from "./dto/service-line-item.dto";
import { ServiceLineItemService } from "./service-line-item.service";

@ApiTags("Service Line Items")
@ApiBearerAuth()
@Controller("service-history/:serviceHistoryId/line-items")
export class ServiceLineItemController {
  constructor(private readonly lineItems: ServiceLineItemService) {}

  @Post()
  @ApiOperation({
    summary: "Add a line item to a DRAFT Service History record",
    description:
      "Decimal quantity and unitPrice are persisted without JavaScript floating-point arithmetic.",
  })
  @ApiParam({ name: "serviceHistoryId", format: "uuid" })
  @ApiCreatedResponse({
    schema: {
      example: {
        type: "LABOR",
        description: "Brake inspection",
        quantity: "1.5",
        unitPrice: "50.00",
        lineTotal: "75.00",
        sortOrder: 0,
      },
    },
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param("serviceHistoryId", new ParseUUIDPipe()) serviceHistoryId: string,
    @Body() dto: CreateServiceLineItemDto,
  ) {
    return this.lineItems.create(user.tenantId, serviceHistoryId, dto);
  }

  @Get()
  @ApiOperation({ summary: "List ordered active line items and subtotal" })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("serviceHistoryId", new ParseUUIDPipe()) serviceHistoryId: string,
  ) {
    return this.lineItems.list(user.tenantId, serviceHistoryId);
  }

  @Get(":lineItemId")
  @ApiOperation({ summary: "Get a line item through its tenant-owned parent" })
  @ApiParam({ name: "lineItemId", format: "uuid" })
  @ApiOkResponse()
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("serviceHistoryId", new ParseUUIDPipe()) serviceHistoryId: string,
    @Param("lineItemId", new ParseUUIDPipe()) lineItemId: string,
  ) {
    return this.lineItems.findOne(user.tenantId, serviceHistoryId, lineItemId);
  }

  @Patch(":lineItemId")
  @ApiOperation({ summary: "Update a line item while its parent is DRAFT" })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("serviceHistoryId", new ParseUUIDPipe()) serviceHistoryId: string,
    @Param("lineItemId", new ParseUUIDPipe()) lineItemId: string,
    @Body() dto: UpdateServiceLineItemDto,
  ) {
    return this.lineItems.update(
      user.tenantId,
      serviceHistoryId,
      lineItemId,
      dto,
    );
  }

  @Delete(":lineItemId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Soft-delete a line item while its parent is DRAFT",
  })
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("serviceHistoryId", new ParseUUIDPipe()) serviceHistoryId: string,
    @Param("lineItemId", new ParseUUIDPipe()) lineItemId: string,
  ): Promise<void> {
    await this.lineItems.remove(user.tenantId, serviceHistoryId, lineItemId);
  }
}

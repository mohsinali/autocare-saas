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
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CancelServiceHistoryDto } from "./dto/cancel-service-history.dto";
import { CompleteServiceHistoryDto } from "./dto/complete-service-history.dto";
import { CreateServiceHistoryDto } from "./dto/create-service-history.dto";
import { ListServiceHistoryDto } from "./dto/list-service-history.dto";
import { UpdateServiceHistoryDto } from "./dto/update-service-history.dto";
import { ServiceHistoryService } from "./service-history.service";

const historyExample = {
  id: "86c4b9c4-3dc1-4ca3-a94e-638c05558042",
  status: "DRAFT",
  visitDate: "2026-08-06T06:30:00.000Z",
  mileageAtService: 45000,
  initialRequest: "Oil service and brake inspection",
  subtotal: "74.98",
  lineItems: [
    {
      type: "PART",
      description: "Oil filter",
      quantity: "2",
      unitPrice: "37.49",
      lineTotal: "74.98",
      sortOrder: 0,
    },
  ],
};

@ApiTags("Service History")
@ApiBearerAuth()
@Controller("service-history")
export class ServiceHistoryController {
  constructor(private readonly history: ServiceHistoryService) {}

  @Post()
  @ApiOperation({
    summary: "Create a DRAFT Service History record",
    description:
      "Branch-local visitDate is stored in UTC. Optional line items are created atomically.",
  })
  @ApiCreatedResponse({ schema: { example: historyExample } })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateServiceHistoryDto,
  ) {
    return this.history.create(user.tenantId, user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: "List tenant Service History records",
    description:
      "Supports pagination, ownership/status/date filters, text search, and sorting. Soft-deleted records are excluded.",
  })
  @ApiOkResponse({
    schema: {
      example: {
        data: [historyExample],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    },
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListServiceHistoryDto,
  ) {
    return this.history.findAll(user.tenantId, query);
  }

  @Get(":id")
  @ApiOperation({
    summary:
      "Get Service History detail with summaries, ordered line items, and subtotal",
  })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ schema: { example: historyExample } })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.history.findOne(user.tenantId, id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a DRAFT Service History record",
    description:
      "Completed and cancelled records are read-only. Lifecycle and audit fields cannot be changed here.",
  })
  @ApiParam({ name: "id", format: "uuid" })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateServiceHistoryDto,
  ) {
    return this.history.update(user.tenantId, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Soft-delete a DRAFT Service History record" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.history.remove(user.tenantId, id);
  }

  @Patch(":id/complete")
  @ApiOperation({
    summary: "Complete a DRAFT Service History record",
    description:
      "Atomically finalizes the record and updates Vehicle.currentMileage. Completed records are permanent and read-only.",
  })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ type: CompleteServiceHistoryDto })
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CompleteServiceHistoryDto,
  ) {
    return this.history.complete(user.tenantId, id, user.id, dto);
  }

  @Patch(":id/cancel")
  @ApiOperation({
    summary: "Cancel an empty DRAFT Service History record",
    description:
      "Cancellation is rejected when active line items exist and never updates vehicle mileage.",
  })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ type: CancelServiceHistoryDto })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CancelServiceHistoryDto,
  ) {
    return this.history.cancel(user.tenantId, id, user.id, dto);
  }
}

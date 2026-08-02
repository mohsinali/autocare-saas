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
import { AppointmentCalendarDto } from "./dto/appointment-calendar.dto";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { ListAppointmentsDto } from "./dto/list-appointments.dto";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto";
import { UpdateAppointmentStatusDto } from "./dto/update-appointment-status.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { AppointmentsService } from "./appointments.service";

const appointmentExample = {
  id: "86c4b9c4-3dc1-4ca3-a94e-638c05558042",
  tenantId: "0da8e3c7-b4d3-4eb5-a56f-e2c8ccad542f",
  branchId: "a66b6428-b122-4f84-aa87-7a0e42d5bc45",
  customerId: "2b04ad8e-b790-40b5-a067-0915149f4107",
  vehicleId: "4b7e2b9e-b629-4bf0-a6de-e1a5149f4107",
  appointmentDateTimeUtc: "2026-08-10T05:30:00.000Z",
  estimatedDurationMinutes: 60,
  serviceRequested: "Oil and filter change",
  status: "SCHEDULED",
  notes: "Please inspect the front brakes.",
  createdBy: "b2ce6612-7150-4cc8-9c47-0d1f02d4348e",
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  deletedAt: null,
};

@ApiTags("Appointments")
@ApiBearerAuth()
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: "Schedule an appointment" })
  @ApiBody({
    type: CreateAppointmentDto,
    examples: {
      standard: {
        value: {
          branchId: appointmentExample.branchId,
          vehicleId: appointmentExample.vehicleId,
          appointmentDateTime: "2026-08-10T10:30:00",
          estimatedDurationMinutes: 60,
          serviceRequested: "Oil and filter change",
          notes: "Please inspect the front brakes.",
        },
      },
    },
  })
  @ApiCreatedResponse({ schema: { example: appointmentExample } })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointments.create(user.tenantId, user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: "List appointments with filters, pagination, search, and sorting",
  })
  @ApiOkResponse({
    schema: {
      example: {
        data: [appointmentExample],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    },
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAppointmentsDto,
  ) {
    return this.appointments.findAll(user.tenantId, query);
  }

  @Get("calendar")
  @ApiOperation({
    summary: "Return appointments in an inclusive UTC calendar range",
  })
  @ApiOkResponse({ schema: { example: [appointmentExample] } })
  calendar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AppointmentCalendarDto,
  ) {
    return this.appointments.calendar(user.tenantId, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an appointment" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ schema: { example: appointmentExample } })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.appointments.findOne(user.tenantId, id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a non-cancelled, non-completed appointment",
  })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({
    type: UpdateAppointmentDto,
    examples: {
      standard: {
        value: {
          estimatedDurationMinutes: 90,
          notes: "Customer will wait on site.",
        },
      },
    },
  })
  @ApiOkResponse({ schema: { example: appointmentExample } })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointments.update(user.tenantId, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Soft-delete an appointment" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.appointments.remove(user.tenantId, id);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Apply a permitted appointment status transition" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({
    type: UpdateAppointmentStatusDto,
    examples: { confirm: { value: { status: "CONFIRMED" } } },
  })
  @ApiOkResponse({
    schema: { example: { ...appointmentExample, status: "CONFIRMED" } },
  })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointments.updateStatus(user.tenantId, id, dto);
  }

  @Patch(":id/reschedule")
  @ApiOperation({
    summary: "Reschedule an appointment using branch-local time",
  })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({
    type: RescheduleAppointmentDto,
    examples: {
      standard: { value: { appointmentDateTime: "2026-08-11T14:00:00" } },
    },
  })
  @ApiOkResponse({ schema: { example: appointmentExample } })
  reschedule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointments.reschedule(user.tenantId, id, dto);
  }
}

import { ApiProperty } from "@nestjs/swagger";
import { IsISO8601 } from "class-validator";

export class RescheduleAppointmentDto {
  @ApiProperty({
    example: "2026-08-11T14:00:00",
    description: "Branch-local date/time without a UTC offset.",
  })
  @IsISO8601({ strict: true })
  appointmentDateTime!: string;
}

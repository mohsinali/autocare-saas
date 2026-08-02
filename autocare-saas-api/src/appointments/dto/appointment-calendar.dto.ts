import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsISO8601, IsOptional, IsUUID } from "class-validator";

export class AppointmentCalendarDto {
  @ApiProperty({
    example: "2026-08-01T00:00:00.000Z",
    description: "Inclusive UTC range start.",
  })
  @IsISO8601({ strict: true })
  startDate!: string;
  @ApiProperty({
    example: "2026-08-31T23:59:59.999Z",
    description: "Inclusive UTC range end.",
  })
  @IsISO8601({ strict: true })
  endDate!: string;
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

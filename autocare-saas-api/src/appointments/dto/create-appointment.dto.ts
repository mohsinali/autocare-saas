import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateAppointmentDto {
  @ApiProperty({ format: "uuid" }) @IsUUID() branchId!: string;
  @ApiProperty({ format: "uuid" }) @IsUUID() vehicleId!: string;
  @ApiProperty({
    example: "2026-08-10T10:30:00",
    description:
      "Branch-local date/time without a UTC offset. It is converted to UTC before persistence.",
  })
  @IsISO8601({ strict: true })
  appointmentDateTime!: string;
  @ApiProperty({ example: 60, minimum: 1, maximum: 1440 })
  @IsInt()
  @Min(1)
  @Max(1440)
  estimatedDurationMinutes!: number;
  @ApiProperty({ example: "Oil and filter change" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  serviceRequested!: string;
  @ApiPropertyOptional({ example: "Please inspect the front brakes." })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}

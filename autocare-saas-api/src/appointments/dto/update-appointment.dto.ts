import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: 90, minimum: 1, maximum: 1440 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  estimatedDurationMinutes?: number;
  @ApiPropertyOptional({ example: "Oil and filter change, plus tire rotation" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  serviceRequested?: string;
  @ApiPropertyOptional({
    example: "Customer will wait on site.",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}

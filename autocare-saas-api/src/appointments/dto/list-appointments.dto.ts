import { ApiPropertyOptional } from "@nestjs/swagger";
import { AppointmentStatus } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const SORT_FIELDS = [
  "appointmentDateTimeUtc",
  "createdAt",
  "updatedAt",
  "status",
] as const;
const SORT_DIRECTIONS = ["asc", "desc"] as const;

export class ListAppointmentsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  branchId?: string;
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  customerId?: string;
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
  @ApiPropertyOptional({ description: "Matches serviceRequested." })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serviceType?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({ strict: true })
  startDate?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({ strict: true })
  endDate?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value,
  )
  @IsBoolean()
  today?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value,
  )
  @IsBoolean()
  tomorrow?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value,
  )
  @IsBoolean()
  upcoming?: boolean;
  @ApiPropertyOptional({ enum: SORT_FIELDS, default: "appointmentDateTimeUtc" })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy: (typeof SORT_FIELDS)[number] = "appointmentDateTimeUtc";
  @ApiPropertyOptional({ enum: SORT_DIRECTIONS, default: "asc" })
  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  sortOrder: (typeof SORT_DIRECTIONS)[number] = "asc";
}

import { ApiPropertyOptional } from "@nestjs/swagger";
import { ServiceHistoryStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
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

const SORT_FIELDS = ["visitDate", "createdAt", "updatedAt", "status"] as const;
const SORT_DIRECTIONS = ["asc", "desc"] as const;

export class ListServiceHistoryDto {
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
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;
  @ApiPropertyOptional({ enum: ServiceHistoryStatus })
  @IsOptional()
  @IsEnum(ServiceHistoryStatus)
  status?: ServiceHistoryStatus;
  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({ strict: true })
  visitDateFrom?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({ strict: true })
  visitDateTo?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
  @ApiPropertyOptional({ enum: SORT_FIELDS, default: "visitDate" })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy: (typeof SORT_FIELDS)[number] = "visitDate";
  @ApiPropertyOptional({ enum: SORT_DIRECTIONS, default: "desc" })
  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  sortOrder: (typeof SORT_DIRECTIONS)[number] = "desc";
}

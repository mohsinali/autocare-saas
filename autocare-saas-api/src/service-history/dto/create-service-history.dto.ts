import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { CreateServiceLineItemDto } from "./service-line-item.dto";

export class CreateServiceHistoryDto {
  @ApiProperty({ format: "uuid" }) @IsUUID() branchId!: string;
  @ApiProperty({ format: "uuid" }) @IsUUID() customerId!: string;
  @ApiProperty({ format: "uuid" }) @IsUUID() vehicleId!: string;
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;
  @ApiProperty({
    example: "2026-08-06T11:30:00",
    description: "Branch-local date/time without a UTC offset.",
  })
  @IsISO8601({ strict: true })
  visitDate!: string;
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileageAtService?: number;
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customerComplaint?: string;
  @ApiProperty({ maxLength: 4000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  initialRequest!: string;
  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  diagnosis?: string;
  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  workSummary?: string;
  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  recommendations?: string;
  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  internalNotes?: string;
  @ApiPropertyOptional({
    type: [CreateServiceLineItemDto],
    description: "Created atomically with the draft.",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceLineItemDto)
  lineItems?: CreateServiceLineItemDto[];
}

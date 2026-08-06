import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { ServiceLineItemType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateServiceLineItemDto {
  @ApiProperty({ enum: ServiceLineItemType, example: ServiceLineItemType.PART })
  @IsEnum(ServiceLineItemType)
  type!: ServiceLineItemType;

  @ApiProperty({ example: "Engine oil filter", maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @ApiProperty({
    example: "1.000",
    description: "Positive decimal quantity with up to three decimal places.",
  })
  @IsDecimal({ decimal_digits: "0,3", force_decimal: false })
  @Matches(/^(?=.*[1-9])\d+(?:\.\d{1,3})?$/, {
    message: "quantity must be greater than zero",
  })
  quantity!: string;

  @ApiProperty({
    example: "24.99",
    description: "Non-negative monetary amount with up to two decimal places.",
  })
  @IsDecimal({ decimal_digits: "0,2", force_decimal: false })
  @Matches(/^\d+(?:\.\d{1,2})?$/, { message: "unitPrice must not be negative" })
  unitPrice!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  sortOrder?: number;
}

export class UpdateServiceLineItemDto extends PartialType(
  CreateServiceLineItemDto,
) {}

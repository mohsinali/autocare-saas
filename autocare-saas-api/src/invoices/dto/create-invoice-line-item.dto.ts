import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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

export class CreateInvoiceLineItemDto {
  @ApiPropertyOptional({ enum: ServiceLineItemType })
  @IsOptional()
  @IsEnum(ServiceLineItemType)
  type?: ServiceLineItemType;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ example: "1.00" })
  @IsDecimal({ decimal_digits: "0,2", force_decimal: false })
  @Matches(/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/, {
    message: "quantity must be greater than zero",
  })
  quantity!: string;

  @ApiProperty({ example: "25.00" })
  @IsDecimal({ decimal_digits: "0,2", force_decimal: false })
  @Matches(/^\d+(?:\.\d{1,2})?$/, { message: "unitPrice must not be negative" })
  unitPrice!: string;

  @ApiPropertyOptional({ example: "0.00" })
  @IsOptional()
  @IsDecimal({ decimal_digits: "0,2", force_decimal: false })
  @Matches(/^(?:100(?:\.0{1,2})?|\d{1,2}(?:\.\d{1,2})?)$/, {
    message: "taxRate must be between 0 and 100",
  })
  taxRate?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  sortOrder?: number;
}

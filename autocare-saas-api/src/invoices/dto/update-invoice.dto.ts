import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDecimal,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export class UpdateInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxLabel?: string;

  @ApiPropertyOptional({ example: "0.00" })
  @IsOptional()
  @IsDecimal({ decimal_digits: "0,2", force_decimal: false })
  @Matches(/^\d+(?:\.\d{1,2})?$/, {
    message: "discountAmount must not be negative",
  })
  discountAmount?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;
}

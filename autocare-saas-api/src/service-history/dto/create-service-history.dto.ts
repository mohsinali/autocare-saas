import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
export class CreateServiceHistoryDto {
  @ApiProperty() @IsUUID() customerId!: string;
  @ApiProperty({ example: '2026-07-31' }) @IsDateString() serviceDate!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(4000) description!: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) mileage?: number;
  @ApiProperty({ example: 249.99 }) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) totalAmount!: number;
}

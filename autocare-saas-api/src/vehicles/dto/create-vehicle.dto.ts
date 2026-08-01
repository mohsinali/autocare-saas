import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelType, Transmission, VehicleStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty() @IsUUID() customerId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(40) registrationNumber!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) nickname?: string;
  @ApiPropertyOptional({ minLength: 17, maxLength: 17 }) @IsOptional() @IsString() @Length(17, 17) vin?: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80) make!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80) model!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) variant?: string;
  @ApiProperty({ minimum: 1886 }) @Type(() => Number) @IsInt() @Min(1886) @Max(new Date().getFullYear() + 1) year!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) color?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) engineNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) engineSize?: string;
  @ApiProperty({ enum: FuelType }) @IsEnum(FuelType) fuelType!: FuelType;
  @ApiProperty({ enum: Transmission }) @IsEnum(Transmission) transmission!: Transmission;
  @ApiPropertyOptional() @IsOptional() @IsDateString() purchaseDate?: string;
  @ApiProperty({ minimum: 0 }) @Type(() => Number) @IsInt() @Min(0) currentMileage!: number;
  @ApiPropertyOptional({ minimum: 0 }) @IsOptional() @Type(() => Number) @IsInt() @Min(0) lastServiceMileage?: number;
  @ApiPropertyOptional({ enum: VehicleStatus, default: VehicleStatus.ACTIVE }) @IsOptional() @IsEnum(VehicleStatus) status?: VehicleStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}

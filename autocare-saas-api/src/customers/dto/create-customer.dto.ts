import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateCustomerDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80) firstName!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80) lastName!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(30) phone!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

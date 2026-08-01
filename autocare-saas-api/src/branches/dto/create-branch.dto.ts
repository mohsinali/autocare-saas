import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { IsIanaTimezone } from '../../common/validators/is-iana-timezone.decorator';

const BUSINESS_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const PHONE_PATTERN = /^[+0-9().\-\s]{7,30}$/;

export class CreateBranchDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @ApiProperty({ example: '+1 212 555 0100' }) @IsString() @Matches(PHONE_PATTERN, { message: 'phone must be a valid phone number' }) phone!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(160) addressLine1!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) addressLine2?: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) city!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) stateProvince!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(30) postalCode!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) country!: string;
  @ApiProperty({ example: 'Asia/Karachi' }) @IsIanaTimezone() timezone!: string;
  @ApiProperty({ example: '09:00', pattern: BUSINESS_TIME_PATTERN.source }) @IsString() @Matches(BUSINESS_TIME_PATTERN, { message: 'businessOpeningTime must use HH:mm format' }) businessOpeningTime!: string;
  @ApiProperty({ example: '18:00', pattern: BUSINESS_TIME_PATTERN.source }) @IsString() @Matches(BUSINESS_TIME_PATTERN, { message: 'businessClosingTime must use HH:mm format' }) businessClosingTime!: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value) @IsBoolean() isActive?: boolean;
}

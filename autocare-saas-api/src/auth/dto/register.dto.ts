import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IsIanaTimezone } from '../../common/validators/is-iana-timezone.decorator';
export class RegisterDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120) tenantName!: string;
  @ApiProperty({ example: 'northside-garage' }) @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(63) tenantSlug!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty({ minLength: 12 }) @IsString() @MinLength(12) @MaxLength(128) password!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80) firstName!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80) lastName!: string;
  @ApiPropertyOptional({ example: 'Asia/Karachi', default: 'UTC' }) @IsOptional() @IsIanaTimezone() timezone?: string;
}

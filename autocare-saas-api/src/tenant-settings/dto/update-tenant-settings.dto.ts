import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, Length, Matches } from "class-validator";

export class UpdateTenantSettingsDto {
  @ApiPropertyOptional({
    description: "Three-letter ISO-style currency code.",
    example: "USD",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  currencyCode?: string;
}

import { ApiProperty } from "@nestjs/swagger";

export class TenantSettingsDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({
    description: "Three-letter ISO-style currency code.",
    example: "USD",
  })
  currencyCode!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

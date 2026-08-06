import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CompleteServiceHistoryDto {
  @ApiPropertyOptional({
    minimum: 0,
    description:
      "Required here when the draft does not already contain mileage.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileageAtService?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  workSummary?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  recommendations?: string;
}

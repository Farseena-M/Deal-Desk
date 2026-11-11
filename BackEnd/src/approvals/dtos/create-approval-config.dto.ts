import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateApprovalConfigDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  minDiscount: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxDiscount: number;

  @IsBoolean()
  minInclusive: boolean;

  @IsBoolean()
  maxInclusive: boolean;

  @IsArray()
  @IsString({ each: true })
  approverRoles: string[];

  @IsBoolean()
  autoApprove: boolean;
}
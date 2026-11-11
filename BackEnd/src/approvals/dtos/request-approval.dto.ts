import { IsMongoId, IsNumber, Max, Min } from 'class-validator';

export class RequestApprovalDto {
  @IsMongoId()
  dealId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent: number;
}
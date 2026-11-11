import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Max,
  IsInt,
} from 'class-validator';

export class CreateDealDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsMongoId()
  customerId: string;

  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent: number;
}

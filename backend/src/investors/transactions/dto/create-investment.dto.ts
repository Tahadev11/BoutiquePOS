import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInvestmentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  // Investment money arrives — no paymentMethod needed
  // (mirrors CreatePurchaseDto which also has no paymentMethod).

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;
}
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEmployeeTransactionDto {
  @IsEnum(['salary', 'payment', 'advance', 'bonus', 'deduction'])
  type: 'salary' | 'payment' | 'advance' | 'bonus' | 'deduction';

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsEnum(['cash', 'bank', 'card'])
  paymentMethod?: 'cash' | 'bank' | 'card';

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;
}
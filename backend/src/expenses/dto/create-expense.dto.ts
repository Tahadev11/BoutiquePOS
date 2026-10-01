import {
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateExpenseDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  expenseDate: string;
}
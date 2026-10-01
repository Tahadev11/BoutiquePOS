import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ExpenseDocument =
  HydratedDocument<Expense>;

@Schema({
  timestamps: true,
})
export class Expense {
  @Prop({
    required: true,
    min: 0.01,
  })
  amount: number;

  @Prop({
    required: true,
    type: Date,
    index: true,
  })
  expenseDate: Date;
}

export const ExpenseSchema =
  SchemaFactory.createForClass(Expense);

ExpenseSchema.index({
  expenseDate: -1,
});
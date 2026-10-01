import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import {
  Expense,
  ExpenseSchema,
} from './schemas/expense.schema';

import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Expense.name,
        schema: ExpenseSchema,
      },
    ]),

    PassportModule.register({}),

    AuthModule,
  ],

  controllers: [
    ExpensesController,
  ],

  providers: [
    ExpensesService,
  ],

  exports: [
    ExpensesService,
  ],
})
export class ExpensesModule {}
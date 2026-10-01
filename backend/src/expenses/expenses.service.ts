import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  Expense,
  ExpenseDocument,
} from './schemas/expense.schema';

import { Model } from 'mongoose';

import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  // ==========================================
  // CREATE EXPENSE
  // ==========================================

  async create(
    createExpenseDto: CreateExpenseDto,
  ) {
    const expense =
      new this.expenseModel({
        amount:
          createExpenseDto.amount,

        expenseDate:
          new Date(
            createExpenseDto.expenseDate,
          ),
      });

    return expense.save();
  }

  // ==========================================
  // GET ALL EXPENSES
  // ==========================================

  async findAll() {
    return this.expenseModel
      .find()
      .sort({
        expenseDate: -1,
        createdAt: -1,
      })
      .exec();
  }

  // ==========================================
  // GET ONE EXPENSE
  // ==========================================

  async findOne(id: string) {
    const expense =
      await this.expenseModel
        .findById(id)
        .exec();

    if (!expense) {
      throw new NotFoundException(
        'Expense not found',
      );
    }

    return expense;
  }

  // ==========================================
  // UPDATE EXPENSE
  // ==========================================

  async update(
    id: string,
    createExpenseDto: CreateExpenseDto,
  ) {
    const expense =
      await this.expenseModel
        .findByIdAndUpdate(
          id,
          {
            amount:
              createExpenseDto.amount,

            expenseDate:
              new Date(
                createExpenseDto.expenseDate,
              ),
          },
          {
            returnDocument: 'after',
            runValidators: true,
          },
        )
        .exec();

    if (!expense) {
      throw new NotFoundException(
        'Expense not found',
      );
    }

    return expense;
  }

  // ==========================================
  // DELETE EXPENSE
  // ==========================================

  async remove(id: string) {
    const expense =
      await this.expenseModel
        .findByIdAndDelete(id)
        .exec();

    if (!expense) {
      throw new NotFoundException(
        'Expense not found',
      );
    }

    return {
      message:
        'Expense deleted successfully',
    };
  }
}
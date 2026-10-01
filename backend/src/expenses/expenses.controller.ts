import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ExpensesService } from './expenses.service';

import { CreateExpenseDto } from './dto/create-expense.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
  ) {}

  // ==========================================
  // CREATE EXPENSE
  // POST /expenses
  // ==========================================

  @Post()
  create(
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.expensesService.create(
      createExpenseDto,
    );
  }

  // ==========================================
  // GET ALL EXPENSES
  // GET /expenses
  // ==========================================

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  // ==========================================
  // GET ONE EXPENSE
  // GET /expenses/:id
  // ==========================================

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.expensesService.findOne(id);
  }

  // ==========================================
  // UPDATE EXPENSE
  // PATCH /expenses/:id
  // ==========================================

  @Patch(':id')
  update(
    @Param('id') id: string,

    @Body()
    createExpenseDto: CreateExpenseDto,
  ) {
    return this.expensesService.update(
      id,
      createExpenseDto,
    );
  }

  // ==========================================
  // DELETE EXPENSE
  // DELETE /expenses/:id
  // ==========================================

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.expensesService.remove(id);
  }
}
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

import { EmployeesService } from './employees.service';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateEmployeeTransactionDto } from './transactions/dto/create-employee-transaction.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
  ) {}

  // ============================================
  // CREATE EMPLOYEE
  // ============================================

  @Post()
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(createEmployeeDto);
  }

  // ============================================
  // GET ALL EMPLOYEES
  // ============================================

  @Get()
  findAll() {
    return this.employeesService.findAll();
  }

  // ============================================
  // GET SINGLE EMPLOYEE
  // ============================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  // ============================================
  // UPDATE EMPLOYEE
  // ============================================

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  // ============================================
  // DELETE EMPLOYEE
  // ============================================

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  // ============================================
  // GET EMPLOYEE LEDGER
  // ============================================

  @Get(':id/ledger')
  getLedger(@Param('id') id: string) {
    return this.employeesService.getLedger(id);
  }

  // ============================================
  // CREATE EMPLOYEE TRANSACTION
  // ============================================
  //
  // Single endpoint for all 5 types:
  //   salary | payment | advance | bonus | deduction
  // ============================================

  @Post(':id/transactions')
  createTransaction(
    @Param('id') id: string,
    @Body() dto: CreateEmployeeTransactionDto,
  ) {
    return this.employeesService.createTransaction(id, dto);
  }
}
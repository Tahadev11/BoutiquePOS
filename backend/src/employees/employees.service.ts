import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import {
  Employee,
  EmployeeDocument,
} from './schemas/employee.schema';

import {
  EmployeeTransaction,
  EmployeeTransactionDocument,
} from './transactions/schemas/employee-transaction.schema';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateEmployeeTransactionDto } from './transactions/dto/create-employee-transaction.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name)
    private employeeModel: Model<EmployeeDocument>,

    @InjectModel(EmployeeTransaction.name)
    private employeeTransactionModel: Model<EmployeeTransactionDocument>,
  ) {}

  // ============================================
  // BALANCE DIRECTION
  // ============================================
  //
  // Returns the signed delta to apply to the
  // employee balance for a given transaction type.
  // ============================================

  private getBalanceDelta(
    type: CreateEmployeeTransactionDto['type'],
    amount: number,
  ): number {
    switch (type) {
      case 'salary':
      case 'bonus':
        return amount;      // we owe more

      case 'payment':
      case 'advance':
      case 'deduction':
        return -amount;     // we owe less

      default:
        return 0;
    }
  }

  // ============================================
  // CREATE EMPLOYEE
  // ============================================

  async create(createEmployeeDto: CreateEmployeeDto) {
    const employee = new this.employeeModel({
      name: createEmployeeDto.name,
      designation: createEmployeeDto.designation,
      phone: createEmployeeDto.phone ?? '',
      address: createEmployeeDto.address ?? '',
      joiningDate: createEmployeeDto.joiningDate
        ? new Date(createEmployeeDto.joiningDate)
        : new Date(),
      basicSalary: createEmployeeDto.basicSalary ?? 0,
      balance: createEmployeeDto.balance ?? 0,
      isActive: true,
    });

    return employee.save();
  }

  // ============================================
  // GET ALL EMPLOYEES
  // ============================================

  async findAll() {
    return this.employeeModel
      .find()
      .sort({
        isActive: -1,
        createdAt: -1,
      })
      .exec();
  }

  // ============================================
  // GET SINGLE EMPLOYEE
  // ============================================

  async findOne(id: string) {
    const employee =
      await this.employeeModel.findById(id).exec();

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  // ============================================
  // UPDATE EMPLOYEE
  // ============================================

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ) {
    const employee =
      await this.employeeModel.findById(id);

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (updateEmployeeDto.name !== undefined) {
      employee.name = updateEmployeeDto.name;
    }

    if (updateEmployeeDto.designation !== undefined) {
      employee.designation = updateEmployeeDto.designation;
    }

    if (updateEmployeeDto.phone !== undefined) {
      employee.phone = updateEmployeeDto.phone;
    }

    if (updateEmployeeDto.address !== undefined) {
      employee.address = updateEmployeeDto.address;
    }

    if (updateEmployeeDto.joiningDate !== undefined) {
      employee.joiningDate = new Date(updateEmployeeDto.joiningDate);
    }

    if (updateEmployeeDto.basicSalary !== undefined) {
      employee.basicSalary = updateEmployeeDto.basicSalary;
    }

    if (updateEmployeeDto.isActive !== undefined) {
      employee.isActive = updateEmployeeDto.isActive;
    }

    // Balance is intentionally NOT editable.
    //
    // Balance can only change through:
    // - Salary accruals
    // - Payments
    // - Advances
    // - Bonuses
    // - Deductions

    return employee.save();
  }

  // ============================================
  // DELETE EMPLOYEE
  // ============================================

  async remove(id: string) {
    const employee =
      await this.employeeModel.findById(id);

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // --------------------------------------------
    // Employee must have exactly zero balance
    // --------------------------------------------
    //
    // Positive balance:
    //   We still owe the employee salary.
    //
    // Negative balance:
    //   Employee owes us (over-paid).
    //
    // Both cases mean the account is NOT settled.
    // --------------------------------------------

    if (employee.balance !== 0) {
      if (employee.balance > 0) {
        throw new BadRequestException(
          'Employee cannot be deleted while an unpaid salary balance exists. Clear the balance first.',
        );
      }

      throw new BadRequestException(
        'Employee cannot be deleted while an over-paid balance exists. Settle the account first.',
      );
    }

    // --------------------------------------------
    // Check transaction history
    // --------------------------------------------

    const transactionCount =
      await this.employeeTransactionModel.countDocuments({
        employee: employee._id,
      });

    if (transactionCount > 0) {
      throw new BadRequestException(
        'Employee cannot be deleted because transaction history exists. Deactivate the employee instead.',
      );
    }

    await this.employeeModel.deleteOne({
      _id: employee._id,
    });

    return {
      message: 'Employee deleted successfully',
    };
  }

  // ============================================
  // CREATE EMPLOYEE TRANSACTION
  // ============================================
  //
  // Single endpoint for all 5 transaction types.
  //
  // Type determines direction of balance change.
  // ============================================

  async createTransaction(
    employeeId: string,
    dto: CreateEmployeeTransactionDto,
  ) {
    const employee =
      await this.employeeModel.findById(employeeId);

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (!employee.isActive) {
      throw new BadRequestException(
        'This employee is inactive',
      );
    }

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException(
        'Transaction amount must be greater than 0',
      );
    }

    // --------------------------------------------
    // Update employee balance
    // --------------------------------------------

    const balanceBefore = employee.balance;

    const delta = this.getBalanceDelta(dto.type, dto.amount);

    employee.balance = balanceBefore + delta;

    await employee.save();

    // --------------------------------------------
    // Create transaction record
    // --------------------------------------------

    const transaction =
      new this.employeeTransactionModel({
        employee: employee._id,

        employeeName: employee.name,

        employeeDesignation: employee.designation,

        type: dto.type,

        amount: dto.amount,

        balanceBefore,

        paymentMethod: dto.paymentMethod,

        note: dto.note,

        ...(dto.transactionDate
          ? { transactionDate: dto.transactionDate }
          : {}),

        balanceAfter: employee.balance,
      });

    await transaction.save();

    return {
      message: 'Transaction recorded successfully',
      transaction,
      employeeBalance: employee.balance,
    };
  }

  // ============================================
  // GET EMPLOYEE LEDGER
  // ============================================

  async getLedger(employeeId: string) {
    const employee =
      await this.employeeModel.findById(employeeId).exec();

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const employeeObjectId =
      new Types.ObjectId(employeeId);

    const transactions =
      await this.employeeTransactionModel
        .find({
          employee: employeeObjectId,
        })
        .sort({
          transactionDate: -1,
          createdAt: -1,
        })
        .exec();

    return {
      employee,
      currentBalance: employee.balance,
      transactions,
    };
  }
}
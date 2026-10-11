import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EmployeeTransactionDocument =
  HydratedDocument<EmployeeTransaction>;

// ============================================================
// EMPLOYEE TRANSACTION
// ============================================================
//
// Five transaction types exist:
//
//   salary    : monthly salary accrued.      balance += amount
//   bonus     : extra reward to employee.    balance += amount
//   payment   : salary paid to employee.     balance -= amount
//   advance   : money given before earning.  balance -= amount
//   deduction : fine / penalty applied.      balance -= amount
//
// There is NO items array on purpose.
// Employee transactions are pure cash movements.
// ============================================================

@Schema({ timestamps: true })
export class EmployeeTransaction {
  // ==========================================================
  // EMPLOYEE
  // ==========================================================

  @Prop({
    type: Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  })
  employee: Types.ObjectId;

  // ==========================================================
  // EMPLOYEE SNAPSHOT
  // ==========================================================
  //
  // Old payslips must still read correctly even if
  // the employee is renamed or promoted later.
  // ==========================================================

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  employeeName: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  employeeDesignation: string;

  // ==========================================================
  // TRANSACTION DATE
  // ==========================================================

  @Prop({
    type: Date,
    default: Date.now,
    required: true,
    index: true,
  })
  transactionDate: Date;

  // ==========================================================
  // TRANSACTION TYPE
  // ==========================================================

  @Prop({
    type: String,
    enum: ['salary', 'payment', 'advance', 'bonus', 'deduction'],
    required: true,
    index: true,
  })
  type: 'salary' | 'payment' | 'advance' | 'bonus' | 'deduction';

  // ==========================================================
  // TRANSACTION AMOUNT
  // ==========================================================
  //
  // Always positive.
  //
  // Direction is determined by `type`, not by this amount.
  // ==========================================================

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  amount: number;

  // ==========================================================
  // BALANCE BEFORE TRANSACTION
  // ==========================================================
  //
  // Negative values are intentionally allowed.
  // ==========================================================

  @Prop({
    type: Number,
    required: true,
  })
  balanceBefore: number;

  // ==========================================================
  // PAYMENT METHOD
  // ==========================================================
  //
  // Only meaningful for `payment` and `advance` transactions
  // (money leaving the boutique).
  // ==========================================================

  @Prop({
    type: String,
    enum: ['cash', 'bank', 'card'],
  })
  paymentMethod?: 'cash' | 'bank' | 'card';

  // ==========================================================
  // NOTE
  // ==========================================================

  @Prop({
    type: String,
    trim: true,
  })
  note?: string;

  // ==========================================================
  // BALANCE AFTER TRANSACTION
  // ==========================================================

  @Prop({
    type: Number,
    required: true,
  })
  balanceAfter: number;
}

// ============================================================
// SCHEMA
// ============================================================

export const EmployeeTransactionSchema =
  SchemaFactory.createForClass(EmployeeTransaction);

// ============================================================
// INDEXES
// ============================================================

EmployeeTransactionSchema.index({
  employee: 1,
  transactionDate: -1,
});

EmployeeTransactionSchema.index({
  employee: 1,
  type: 1,
  transactionDate: -1,
});
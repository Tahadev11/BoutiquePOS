import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EmployeeDocument = HydratedDocument<Employee>;

@Schema({ timestamps: true })
export class Employee {
  // ============================================
  // EMPLOYEE NAME
  // ============================================

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  // ============================================
  // DESIGNATION
  // ============================================
  //
  // Free-text role of the employee.
  //
  // Examples:
  //   "Salesperson"
  //   "Tailor"
  //   "Manager"
  //   "Cashier"
  // ============================================

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  designation: string;

  // ============================================
  // CONTACT DETAILS
  // ============================================

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  phone: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  address: string;

  // ============================================
  // JOINING DATE
  // ============================================

  @Prop({
    type: Date,
    default: Date.now,
  })
  joiningDate: Date;

  // ============================================
  // BASIC MONTHLY SALARY
  // ============================================
  //
  // Reference amount for the employee's monthly
  // salary. Used only as a default when recording
  // a "salary" transaction.
  //
  // The actual balance is driven by transactions,
  // NOT by this field.
  // ============================================

  @Prop({
    type: Number,
    required: true,
    default: 0,
    min: 0,
  })
  basicSalary: number;

  // ============================================
  // EMPLOYEE BALANCE
  // ============================================
  //
  // Positive balance:
  //   Amount the boutique still owes the employee.
  //
  // Zero:
  //   Account is fully settled.
  //
  // Negative balance:
  //   Employee owes the boutique (usually from
  //   taking an advance beyond earned salary).
  //
  // Example:
  //
  // Salary accrued = Rs. 50,000
  // Payment made   = Rs. 60,000
  //
  // Balance = -Rs. 10,000
  //
  // This means Rs. 10,000 was over-paid and will
  // automatically be adjusted against future
  // salary accruals.
  //
  // IMPORTANT:
  // Do NOT use min: 0 here.
  // Negative balances are intentionally allowed.
  // ============================================

  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  balance: number;

  // ============================================
  // ACTIVE / INACTIVE
  // ============================================

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}

export const EmployeeSchema =
  SchemaFactory.createForClass(Employee);
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SupplierDocument = HydratedDocument<Supplier>;

@Schema({ timestamps: true })
export class Supplier {
  // ============================================
  // SUPPLIER NAME
  // ============================================

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  // ============================================
  // SUPPLIER LOCATION
  // ============================================

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  location: string;

  // ============================================
  // SUPPLIER BALANCE
  // ============================================
  //
  // Positive balance:
  //   Amount we still owe the supplier.
  //
  // Zero:
  //   Account is fully settled.
  //
  // Negative balance:
  //   Advance amount paid to the supplier.
  //
  // Example:
  //
  // Purchase = Rs. 50,000
  // Payment  = Rs. 60,000
  //
  // Balance = -Rs. 10,000
  //
  // This means Rs. 10,000 is an advance
  // with the supplier and will automatically
  // be adjusted against future purchases.
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

export const SupplierSchema =
  SchemaFactory.createForClass(Supplier);
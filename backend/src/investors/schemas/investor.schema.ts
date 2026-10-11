import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InvestorDocument = HydratedDocument<Investor>;

@Schema({ timestamps: true })
export class Investor {
  // ============================================
  // INVESTOR NAME
  // ============================================

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  // ============================================
  // INVESTOR LOCATION
  // ============================================

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  location: string;

  // ============================================
  // INVESTOR BALANCE
  // ============================================
  //
  // Positive balance:
  //   Amount the boutique owes the investor.
  //
  // Zero:
  //   Account is fully settled.
  //
  // Negative balance:
  //   Over-return amount. Investor has received
  //   more than was invested and the excess will
  //   automatically be adjusted against future
  //   investments.
  //
  // Example:
  //
  // Investment = Rs. 50,000
  // Return     = Rs. 60,000
  //
  // Balance = -Rs. 10,000
  //
  // This means Rs. 10,000 is an over-return
  // which will automatically be adjusted against
  // future investments.
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

export const InvestorSchema =
  SchemaFactory.createForClass(Investor);
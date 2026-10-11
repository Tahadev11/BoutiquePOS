import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InvestorTransactionDocument =
  HydratedDocument<InvestorTransaction>;

// ============================================================
// INVESTOR TRANSACTION
// ============================================================
//
// Only two transaction types exist:
//
//   investment : investor gives money to the boutique.
//                balance += amount
//
//   return     : boutique returns money to the investor.
//                balance -= amount
//
// There is NO items array on purpose.
// Investments are pure cash movements — no dresses involved.
// ============================================================

@Schema({ timestamps: true })
export class InvestorTransaction {
  // ==========================================================
  // INVESTOR
  // ==========================================================

  @Prop({
    type: Types.ObjectId,
    ref: 'Investor',
    required: true,
    index: true,
  })
  investor: Types.ObjectId;

  // ==========================================================
  // INVESTOR SNAPSHOT
  // ==========================================================
  //
  // Same reason as supplier snapshot:
  // old receipts must still print correctly even if the
  // investor renames himself later.
  // ==========================================================

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  investorName: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  investorLocation: string;

  // ==========================================================
  // TRANSACTION DATE
  // ==========================================================
  //
  // Frontend may provide the actual date of the transaction.
  // If not, current date is used automatically.
  //
  // This allows recording an older investment or return
  // using its real date.
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
    enum: ['investment', 'return'],
    required: true,
    index: true,
  })
  type: 'investment' | 'return';

  // ==========================================================
  // TRANSACTION AMOUNT
  // ==========================================================
  //
  // Always positive.
  //
  // Investment amount:
  //   Amount the investor gave to the boutique.
  //
  // Return amount:
  //   Amount the boutique gave back to the investor.
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
  //
  // Positive = amount payable to investor.
  // Zero     = settled.
  // Negative = over-return; investor owes boutique.
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
  // Only meaningful for `return` transactions
  // (money leaving the boutique).
  //
  // Investment transactions don't set this because
  // the money is arriving, not being paid out.
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
  //
  // Example (investment):
  //
  // Balance Before = -10,000   (previous over-return)
  // Investment     =  25,000
  // Balance After  =  15,000   (boutique owes investor)
  //
  // Example (return):
  //
  // Balance Before = 50,000
  // Return         = 60,000
  // Balance After  = -10,000   (over-return credit)
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

export const InvestorTransactionSchema =
  SchemaFactory.createForClass(InvestorTransaction);

// ============================================================
// INDEXES
// ============================================================

InvestorTransactionSchema.index({
  investor: 1,
  transactionDate: -1,
});

InvestorTransactionSchema.index({
  investor: 1,
  type: 1,
  transactionDate: -1,
});
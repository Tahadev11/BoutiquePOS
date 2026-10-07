import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SupplierTransactionDocument =
  HydratedDocument<SupplierTransaction>;

// ============================================================
// PURCHASE ITEM
// ============================================================

@Schema({ _id: false })
export class SupplierPurchaseItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  product: Types.ObjectId;

  // Product name at the time of purchase.
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  dressName: string;

  // Brand at the time of purchase.
  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  brand: string;

  // Category at the time of purchase.
  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  category: string;

  // Size at the time of purchase.
  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  size: string;

  // Color at the time of purchase.
  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  color: string;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  quantity: number;

  // Purchase price at the time of purchase.
  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  purchasePrice: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  subtotal: number;
}

export const SupplierPurchaseItemSchema =
  SchemaFactory.createForClass(SupplierPurchaseItem);

// ============================================================
// SUPPLIER TRANSACTION
// ============================================================

@Schema({ timestamps: true })
export class SupplierTransaction {
  // ==========================================================
  // SUPPLIER
  // ==========================================================

  @Prop({
    type: Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true,
  })
  supplier: Types.ObjectId;

  // ==========================================================
  // SUPPLIER SNAPSHOT
  // ==========================================================

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  supplierName: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  supplierLocation: string;

  // ==========================================================
  // TRANSACTION DATE
  // ==========================================================
  //
  // The frontend may provide a transaction date.
  //
  // If no date is provided, MongoDB/backend will use
  // the current date automatically.
  //
  // This allows the user to record an older purchase
  // or payment using its actual transaction date.
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
    enum: ['purchase', 'payment'],
    required: true,
    index: true,
  })
  type: 'purchase' | 'payment';

  // ==========================================================
  // TRANSACTION AMOUNT
  // ==========================================================
  //
  // Always positive.
  //
  // Purchase amount:
  //   Amount of stock purchased.
  //
  // Payment amount:
  //   Amount paid to supplier.
  //
  // The direction of the transaction is determined
  // by the transaction type, not by this amount.
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
  // Positive = amount payable to supplier.
  // Zero     = settled.
  // Negative = advance with supplier.
  // ==========================================================

  @Prop({
    type: Number,
    required: true,
  })
  balanceBefore: number;

  // ==========================================================
  // PURCHASE ITEMS
  // ==========================================================

  @Prop({
    type: [SupplierPurchaseItemSchema],
    default: [],
  })
  items: SupplierPurchaseItem[];

  // ==========================================================
  // PAYMENT METHOD
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
  // Negative values are intentionally allowed.
  //
  // Example:
  //
  // Balance Before = 50,000
  // Payment        = 60,000
  // Balance After  = -10,000
  //
  // This means Rs. 10,000 is an advance with
  // the supplier.
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

export const SupplierTransactionSchema =
  SchemaFactory.createForClass(SupplierTransaction);

// ============================================================
// INDEXES
// ============================================================

SupplierTransactionSchema.index({
  supplier: 1,
  transactionDate: -1,
});

SupplierTransactionSchema.index({
  supplier: 1,
  type: 1,
  transactionDate: -1,
});
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
  // This preserves historical data even if the product
  // name is changed later.
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  dressName: string;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  quantity: number;

  // Purchase price at the time of purchase.
  // This is NOT taken from the product later.
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

  // Supplier name at the time of transaction.
  // This keeps old ledger records accurate if the supplier
  // name is changed later.
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  supplierName: string;

  // Supplier location at the time of transaction.
  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  supplierLocation: string;

  // ==========================================================
  // TRANSACTION DATE
  // ==========================================================

  // Allows us to know the exact date/time of the transaction.
  // `createdAt` is also available because timestamps are enabled,
  // but this field allows us to support a custom purchase date
  // later if needed.
  @Prop({
    type: Date,
    default: Date.now,
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

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  amount: number;

  // ==========================================================
  // BALANCE BEFORE TRANSACTION
  // ==========================================================

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  balanceBefore: number;

  // ==========================================================
  // PURCHASE ITEMS
  // ==========================================================

  // Only purchase transactions contain items.
  //
  // Example:
  //
  // [
  //   {
  //     dressName: "Embroidered Lawn Dress",
  //     quantity: 3,
  //     purchasePrice: 2500,
  //     subtotal: 7500
  //   }
  // ]
  //
  // This allows the ledger to show exactly which dresses
  // were purchased on a previous date.
  @Prop({
    type: [SupplierPurchaseItemSchema],
    default: [],
  })
  items: SupplierPurchaseItem[];

  // ==========================================================
  // PAYMENT METHOD
  // ==========================================================

  // Only payment transactions normally contain this.
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
    min: 0,
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

// Makes supplier ledger queries faster.
SupplierTransactionSchema.index({
  supplier: 1,
  transactionDate: -1,
});

// Makes transaction-type filtering faster.
SupplierTransactionSchema.index({
  supplier: 1,
  type: 1,
  transactionDate: -1,
});

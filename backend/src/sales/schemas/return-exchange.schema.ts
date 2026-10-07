import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// =========================================================
// RETURN ITEM
// =========================================================

@Schema({ _id: false })
export class ReturnItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  product: Types.ObjectId;

  @Prop({
    required: true,
  })
  dressName: string;

  @Prop({
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    required: true,
    min: 0,
  })
  purchasePrice: number;

  @Prop({
    required: true,
    min: 0,
  })
  subtotal: number;

  @Prop({
    required: true,
  })
  profit: number;
}

// =========================================================
// REPLACEMENT ITEM
//
// One returned dress can now have multiple replacement
// dresses.
//
// Example:
//
// returned: Dress A × 1
//
// replacements:
// Dress B × 1
// Dress C × 2
// =========================================================

@Schema({ _id: false })
export class ReplacementItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  product: Types.ObjectId;

  @Prop({
    required: true,
  })
  dressName: string;

  @Prop({
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    required: true,
    min: 0,
  })
  purchasePrice: number;

  @Prop({
    required: true,
    min: 0,
  })
  subtotal: number;
}

// =========================================================
// EXCHANGE ITEM
//
// One returned product can contain multiple replacements.
// =========================================================

@Schema({ _id: false })
export class ExchangeItem {
  // -------------------------------------------------------
  // RETURNED PRODUCT
  // -------------------------------------------------------

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  returnedProduct: Types.ObjectId;

  @Prop({
    required: true,
  })
  returnedDressName: string;

  @Prop({
    required: true,
    min: 1,
  })
  returnedQuantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  returnedPrice: number;

  @Prop({
    required: true,
    min: 0,
  })
  returnedPurchasePrice: number;

  // -------------------------------------------------------
  // MULTIPLE REPLACEMENT PRODUCTS
  // -------------------------------------------------------

  @Prop({
    type: [ReplacementItem],
    required: true,
    default: [],
  })
  replacementItems: ReplacementItem[];
}

// =========================================================
// RETURN / EXCHANGE MAIN SCHEMA
// =========================================================

@Schema({
  timestamps: true,
})
export class ReturnExchange {
  // -------------------------------------------------------
  // DOCUMENT NUMBER
  //
  // Return:
  // RET-00001
  //
  // Exchange:
  // EX-00001
  // -------------------------------------------------------

  @Prop({
    required: true,
    unique: true,
  })
  documentNumber: string;

  // -------------------------------------------------------
  // TRANSACTION TYPE
  // -------------------------------------------------------

  @Prop({
    required: true,
    enum: [
      'return',
      'exchange',
    ],
  })
  type: string;

  // -------------------------------------------------------
  // ORIGINAL INVOICE
  // -------------------------------------------------------

  @Prop({
    required: true,
  })
  originalInvoiceNumber: string;

  // -------------------------------------------------------
  // ORIGINAL SALE REFERENCE
  // -------------------------------------------------------

  @Prop({
    type: Types.ObjectId,
    ref: 'Sale',
    required: true,
  })
  originalSale: Types.ObjectId;

  // -------------------------------------------------------
  // COMPLETE RETURNS
  // -------------------------------------------------------

  @Prop({
    type: [ReturnItem],
    default: [],
  })
  returnedItems: ReturnItem[];

  // -------------------------------------------------------
  // EXCHANGES
  // -------------------------------------------------------

  @Prop({
    type: [ExchangeItem],
    default: [],
  })
  exchangeItems: ExchangeItem[];

  // -------------------------------------------------------
  // TOTAL VALUE OF RETURNED ITEMS
  // -------------------------------------------------------

  @Prop({
    default: 0,
    min: 0,
  })
  returnAmount: number;

  // -------------------------------------------------------
  // TOTAL VALUE OF REPLACEMENT ITEMS
  // -------------------------------------------------------

  @Prop({
    default: 0,
    min: 0,
  })
  exchangeAmount: number;

  // -------------------------------------------------------
  // AMOUNT REFUNDED TO CUSTOMER
  // -------------------------------------------------------

  @Prop({
    default: 0,
    min: 0,
  })
  refundAmount: number;

  // -------------------------------------------------------
  // ADDITIONAL PAYMENT FROM CUSTOMER
  // -------------------------------------------------------

  @Prop({
    default: 0,
    min: 0,
  })
  additionalPayment: number;

  // -------------------------------------------------------
  // NET AMOUNT
  //
  // Positive = customer pays extra
  // Negative = customer receives refund
  // -------------------------------------------------------

  @Prop({
    default: 0,
  })
  netAmount: number;

  // -------------------------------------------------------
  // NET COST
  // -------------------------------------------------------

  @Prop({
    default: 0,
  })
  netCost: number;

  // -------------------------------------------------------
  // NET PROFIT
  // -------------------------------------------------------

  @Prop({
    default: 0,
  })
  netProfit: number;

  // -------------------------------------------------------
  // PAYMENT METHOD
  // -------------------------------------------------------

  @Prop({
    required: true,
    enum: [
      'cash',
      'card',
    ],
  })
  paymentMethod: string;

  // -------------------------------------------------------
  // OPTIONAL NOTE
  // -------------------------------------------------------

  @Prop({
    default: '',
  })
  note: string;
}

// =========================================================
// SCHEMA FACTORY
// =========================================================

export const ReturnExchangeSchema =
  SchemaFactory.createForClass(
    ReturnExchange,
  );

// =========================================================
// DOCUMENT TYPE
// =========================================================

export type ReturnExchangeDocument =
  HydratedDocument<ReturnExchange>;
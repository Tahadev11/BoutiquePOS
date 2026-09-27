import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SaleDocument = HydratedDocument<Sale>;

@Schema({ _id: false })
export class SaleItem {

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  dressName: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0, max: 100 })
  discount: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;
}

export const SaleItemSchema = SchemaFactory.createForClass(SaleItem);


@Schema({ timestamps: true })
export class Sale {

  @Prop({
    type: [SaleItemSchema],
    required: true,
  })
  items: SaleItem[];

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  invoiceNumber: string;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({
    required: true,
    enum: ['cash', 'card'],
  })
  paymentMethod: string;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
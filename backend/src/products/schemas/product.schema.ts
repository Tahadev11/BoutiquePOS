import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {

  @Prop({ type: String, required: true })
  dressName: string;

  @Prop({ type: String, required: true })
  category: string;

  @Prop({ type: String, required: true })
  brand: string;

  @Prop({ type: String, required: true })
  size: string;

  @Prop({ type: String, required: true })
  color: string;

  @Prop({ type: Number, required: true, min: 0 })
  actualPrice: number;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  discount: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  purchasePrice: number;

  @Prop({ type: Number, required: true, min: 0 })
  stockQuantity: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
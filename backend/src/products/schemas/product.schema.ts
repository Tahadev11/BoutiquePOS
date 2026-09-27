import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {

  @Prop({ required: true })
  dressName: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  size: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true, min: 0 })
  actualPrice: number;

  @Prop({ required: true, min: 0, max: 100 })
  discount: number;

  @Prop({ required: true, min: 0 })
  stockQuantity: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
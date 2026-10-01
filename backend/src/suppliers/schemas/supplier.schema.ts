import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SupplierDocument = HydratedDocument<Supplier>;

@Schema({ timestamps: true })
export class Supplier {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  location: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    default: 0,
  })
  balance: number;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}

export const SupplierSchema =
  SchemaFactory.createForClass(Supplier);
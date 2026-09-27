import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import {
  Sale,
  SaleSchema,
} from './schemas/sale.schema';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema';

import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Sale.name,
        schema: SaleSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),

    PassportModule.register({}),

    AuthModule,
  ],

  controllers: [
    SalesController,
  ],

  providers: [
    SalesService,
  ],
})
export class SalesModule {}
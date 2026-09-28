import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import {
  Sale,
  SaleSchema,
} from './schemas/sale.schema.js';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema.js';

import { SalesController } from './sales.controller.js';
import { SalesService } from './sales.service.js';

import { AuthModule } from '../auth/auth.module.js';

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
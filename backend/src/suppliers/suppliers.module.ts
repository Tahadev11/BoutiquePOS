import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

import {
  Supplier,
  SupplierSchema,
} from './schemas/supplier.schema';

import {
  SupplierTransaction,
  SupplierTransactionSchema,
} from './transactions/schemas/supplier-transaction.schema';

import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Supplier.name,
        schema: SupplierSchema,
      },
      {
        name: SupplierTransaction.name,
        schema: SupplierTransactionSchema,
      },
    ]),

    PassportModule.register({}),

    AuthModule,

    ProductsModule,
  ],

  controllers: [
    SuppliersController,
  ],

  providers: [
    SuppliersService,
  ],
})
export class SuppliersModule {}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schemas/product.schema';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),

    PassportModule.register({}),

    AuthModule,
  ],

  controllers: [
    ProductsController,
  ],

  providers: [
    ProductsService,
  ],
})
export class ProductsModule {}
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) { }

  // Add a new dress
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() productData: Partial<Product>) {
    return this.productsService.create(productData);
  }

  // Get all dresses
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.productsService.findAll();
  }

  // Search dresses
  @Get('search')
  @UseGuards(JwtAuthGuard)
  search(@Query('q') query: string) {
    return this.productsService.search(query);
  }

  // Get one dress
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // Update a dress
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() productData: Partial<Product>,
  ) {
    return this.productsService.update(id, productData);
  }

  // Delete a dress
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
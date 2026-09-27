import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { SalesService } from './sales.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
  ) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@Body() checkoutDto: CheckoutDto) {
    return this.salesService.checkout(checkoutDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }
}
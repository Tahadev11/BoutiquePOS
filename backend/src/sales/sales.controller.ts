import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { SalesService } from './sales.service';

import { CheckoutDto } from './dto/checkout.dto';

import {
  CreateReturnExchangeDto,
} from './dto/return-exchange.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
  ) {}

  // =========================================================
  // NORMAL CHECKOUT
  // =========================================================

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(
    @Body() checkoutDto: CheckoutDto,
  ) {
    return this.salesService.checkout(
      checkoutDto,
    );
  }

  // =========================================================
  // FIND ORIGINAL INVOICE
  // =========================================================

  @Get('invoice/:invoiceNumber')
  @UseGuards(JwtAuthGuard)
  findByInvoiceNumber(
    @Param('invoiceNumber')
    invoiceNumber: string,
  ) {
    return this.salesService.findByInvoiceNumber(
      invoiceNumber,
    );
  }

  // =========================================================
  // CREATE RETURN / EXCHANGE
  // =========================================================

  @Post('return-exchange')
  @UseGuards(JwtAuthGuard)
  createReturnExchange(
    @Body()
    dto: CreateReturnExchangeDto,
  ) {
    return this.salesService.createReturnExchange(
      dto,
    );
  }

  // =========================================================
  // GET ALL RETURN / EXCHANGE TRANSACTIONS
  // =========================================================

  @Get('return-exchanges/all')
  @UseGuards(JwtAuthGuard)
  findAllReturnExchanges() {
    return this.salesService.findAllReturnExchanges();
  }

  // =========================================================
  // GET ONE RETURN / EXCHANGE TRANSACTION
  // =========================================================

  @Get('return-exchanges/:id')
  @UseGuards(JwtAuthGuard)
  findReturnExchange(
    @Param('id') id: string,
  ) {
    return this.salesService.findReturnExchange(
      id,
    );
  }

  // =========================================================
  // COMPLETE SALES HISTORY
  // SALES + RETURNS + EXCHANGES
  // =========================================================

  @Get('history/all')
  @UseGuards(JwtAuthGuard)
  findSalesHistory() {
    return this.salesService.findSalesHistory();
  }

  // =========================================================
  // SALES REPORT / SUMMARY
  // =========================================================

  @Get('reports/summary')
  @UseGuards(JwtAuthGuard)
  getSalesSummary(
    @Query('startDate')
    startDate?: string,

    @Query('endDate')
    endDate?: string,
  ) {
    return this.salesService.getSalesSummary(
      startDate,
      endDate,
    );
  }

  // =========================================================
  // EXISTING SALES HISTORY
  // =========================================================

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.salesService.findAll();
  }

  // =========================================================
  // EXISTING SALE BY MONGODB ID
  // =========================================================

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
  ) {
    return this.salesService.findOne(id);
  }
}
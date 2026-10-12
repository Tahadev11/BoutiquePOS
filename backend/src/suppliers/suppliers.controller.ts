import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { SuppliersService } from './suppliers.service';

import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

import { CreatePurchaseDto } from './transactions/dto/create-purchase.dto';
import { CreatePaymentDto } from './transactions/dto/create-payment.dto';
import { CreateReturnDto } from './transactions/dto/create-return.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
  ) {}

  // ============================================
  // CREATE SUPPLIER
  // ============================================

  @Post()
  create(
    @Body()
    createSupplierDto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(
      createSupplierDto,
    );
  }

  // ============================================
  // GET ALL SUPPLIERS
  // ============================================

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  // ============================================
  // GET SINGLE SUPPLIER
  // ============================================

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.suppliersService.findOne(id);
  }

  // ============================================
  // UPDATE SUPPLIER
  // ============================================

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(
      id,
      updateSupplierDto,
    );
  }

  // ============================================
  // DELETE SUPPLIER
  // ============================================

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.suppliersService.remove(id);
  }

  // ============================================
  // GET SUPPLIER LEDGER
  // ============================================

  @Get(':id/ledger')
  getLedger(
    @Param('id')
    id: string,
  ) {
    return this.suppliersService.getLedger(id);
  }

  // ============================================
  // CREATE PURCHASE
  // ============================================

  @Post(':id/purchases')
  createPurchase(
    @Param('id')
    id: string,

    @Body()
    createPurchaseDto: CreatePurchaseDto,
  ) {
    return this.suppliersService.createPurchase(
      id,
      createPurchaseDto,
    );
  }

  // ============================================
  // CREATE PAYMENT
  // ============================================

  @Post(':id/payments')
  createPayment(
    @Param('id')
    id: string,

    @Body()
    createPaymentDto: CreatePaymentDto,
  ) {
    return this.suppliersService.createPayment(
      id,
      createPaymentDto,
    );
  }

    // ============================================
  // CREATE RETURN
  // ============================================

  @Post(':id/returns')
  createReturn(
    @Param('id')
    id: string,

    @Body()
    createReturnDto: CreateReturnDto,
  ) {
    return this.suppliersService.createReturn(
      id,
      createReturnDto,
    );
  }
}
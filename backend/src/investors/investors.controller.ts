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

import { InvestorsService } from './investors.service';

import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';

import { CreateInvestmentDto } from './transactions/dto/create-investment.dto';
import { CreateReturnDto } from './transactions/dto/create-return.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('investors')
@UseGuards(JwtAuthGuard)
export class InvestorsController {
  constructor(
    private readonly investorsService: InvestorsService,
  ) {}

  // ============================================
  // CREATE INVESTOR
  // ============================================

  @Post()
  create(
    @Body() createInvestorDto: CreateInvestorDto,
  ) {
    return this.investorsService.create(
      createInvestorDto,
    );
  }

  // ============================================
  // GET ALL INVESTORS
  // ============================================

  @Get()
  findAll() {
    return this.investorsService.findAll();
  }

  // ============================================
  // GET SINGLE INVESTOR
  // ============================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.investorsService.findOne(id);
  }

  // ============================================
  // UPDATE INVESTOR
  // ============================================

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInvestorDto: UpdateInvestorDto,
  ) {
    return this.investorsService.update(
      id,
      updateInvestorDto,
    );
  }

  // ============================================
  // DELETE INVESTOR
  // ============================================

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.investorsService.remove(id);
  }

  // ============================================
  // GET INVESTOR LEDGER
  // ============================================

  @Get(':id/ledger')
  getLedger(@Param('id') id: string) {
    return this.investorsService.getLedger(id);
  }

  // ============================================
  // CREATE INVESTMENT  (direct amount — no dresses)
  // ============================================

  @Post(':id/investments')
  createInvestment(
    @Param('id') id: string,
    @Body() createInvestmentDto: CreateInvestmentDto,
  ) {
    return this.investorsService.createInvestment(
      id,
      createInvestmentDto,
    );
  }

  // ============================================
  // CREATE RETURN  (direct amount — no dresses)
  // ============================================

  @Post(':id/returns')
  createReturn(
    @Param('id') id: string,
    @Body() createReturnDto: CreateReturnDto,
  ) {
    return this.investorsService.createReturn(
      id,
      createReturnDto,
    );
  }
}
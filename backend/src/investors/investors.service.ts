import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import {
  Investor,
  InvestorDocument,
} from './schemas/investor.schema';

import {
  InvestorTransaction,
  InvestorTransactionDocument,
} from './transactions/schemas/investor-transaction.schema';

import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';
import { CreateInvestmentDto } from './transactions/dto/create-investment.dto';
import { CreateReturnDto } from './transactions/dto/create-return.dto';

@Injectable()
export class InvestorsService {
  constructor(
    @InjectModel(Investor.name)
    private investorModel: Model<InvestorDocument>,

    @InjectModel(InvestorTransaction.name)
    private investorTransactionModel: Model<InvestorTransactionDocument>,
  ) {}

  // ============================================
  // CREATE INVESTOR
  // ============================================

  async create(createInvestorDto: CreateInvestorDto) {
    const investor = new this.investorModel({
      name: createInvestorDto.name,
      location: createInvestorDto.location ?? '',
      balance: createInvestorDto.balance ?? 0,
      isActive: true,
    });

    return investor.save();
  }

  // ============================================
  // GET ALL INVESTORS
  // ============================================

  async findAll() {
    return this.investorModel
      .find()
      .sort({
        isActive: -1,
        createdAt: -1,
      })
      .exec();
  }

  // ============================================
  // GET SINGLE INVESTOR
  // ============================================

  async findOne(id: string) {
    const investor =
      await this.investorModel.findById(id).exec();

    if (!investor) {
      throw new NotFoundException('Investor not found');
    }

    return investor;
  }

  // ============================================
  // UPDATE INVESTOR
  // ============================================

  async update(
    id: string,
    updateInvestorDto: UpdateInvestorDto,
  ) {
    const investor =
      await this.investorModel.findById(id);

    if (!investor) {
      throw new NotFoundException('Investor not found');
    }

    if (updateInvestorDto.name !== undefined) {
      investor.name = updateInvestorDto.name;
    }

    if (updateInvestorDto.location !== undefined) {
      investor.location = updateInvestorDto.location;
    }

    if (updateInvestorDto.isActive !== undefined) {
      investor.isActive = updateInvestorDto.isActive;
    }

    // Balance is intentionally NOT editable.
    //
    // Balance can only change through:
    // - Investments
    // - Returns

    return investor.save();
  }

  // ============================================
  // DELETE INVESTOR
  // ============================================

  async remove(id: string) {
    const investor =
      await this.investorModel.findById(id);

    if (!investor) {
      throw new NotFoundException('Investor not found');
    }

    // --------------------------------------------
    // Investor must have exactly zero balance
    // --------------------------------------------
    //
    // Positive balance:
    //   We still owe the investor money.
    //
    // Negative balance:
    //   Investor owes us (over-return happened).
    //
    // Both cases mean the account is NOT settled.
    //
    // Therefore deletion is allowed ONLY when:
    //
    // balance === 0
    // --------------------------------------------

    if (investor.balance !== 0) {
      if (investor.balance > 0) {
        throw new BadRequestException(
          'Investor cannot be deleted while there is an outstanding payable balance. Clear the investor balance first.',
        );
      }

      throw new BadRequestException(
        'Investor cannot be deleted while an over-return exists. The investor balance must be settled first.',
      );
    }

    // --------------------------------------------
    // Check transaction history
    // --------------------------------------------

    const transactionCount =
      await this.investorTransactionModel.countDocuments({
        investor: investor._id,
      });

    if (transactionCount > 0) {
      throw new BadRequestException(
        'Investor cannot be deleted because transaction history exists. Deactivate the investor instead.',
      );
    }

    await this.investorModel.deleteOne({
      _id: investor._id,
    });

    return {
      message: 'Investor deleted successfully',
    };
  }

  // ============================================
  // CREATE INVESTMENT
  // ============================================
  //
  // This is the direct-amount entry the user asked for.
  // No products, no stock changes.
  //
  // Semantics (mirrors supplier "purchase"):
  //
  // Current balance = -10,000   (we already returned him more)
  // Investment      =  25,000
  // New balance     =  15,000   (we owe him 15,000)
  //
  // A previous over-return is automatically adjusted
  // against the new investment.
  // ============================================

  async createInvestment(
    investorId: string,
    createInvestmentDto: CreateInvestmentDto,
  ) {
    const investor =
      await this.investorModel.findById(investorId);

    if (!investor) {
      throw new NotFoundException('Investor not found');
    }

    if (!investor.isActive) {
      throw new BadRequestException(
        'This investor is inactive',
      );
    }

    if (
      !createInvestmentDto.amount ||
      createInvestmentDto.amount <= 0
    ) {
      throw new BadRequestException(
        'Investment amount must be greater than 0',
      );
    }

    // --------------------------------------------
    // Update investor balance
    // --------------------------------------------

    const balanceBefore = investor.balance;

    investor.balance += createInvestmentDto.amount;

    await investor.save();

    // --------------------------------------------
    // Create investment transaction
    // --------------------------------------------

    const transaction =
      new this.investorTransactionModel({
        investor: investor._id,

        investorName: investor.name,

        investorLocation: investor.location ?? '',

        type: 'investment',

        amount: createInvestmentDto.amount,

        balanceBefore,

        note: createInvestmentDto.note,

        ...(createInvestmentDto.transactionDate
          ? {
              transactionDate:
                createInvestmentDto.transactionDate,
            }
          : {}),

        balanceAfter: investor.balance,
      });

    await transaction.save();

    return {
      message: 'Investment recorded successfully',
      transaction,
      investorBalance: investor.balance,
    };
  }

  // ============================================
  // CREATE RETURN
  // ============================================
  //
  // Mirrors supplier "payment".
  //
  // Current balance = 50,000   (we owe him 50,000)
  // Return          = 60,000
  // New balance     = -10,000  (over-return / advance)
  //
  // The Rs. 10,000 becomes an over-return credit
  // which will be adjusted against the next investment.
  // ============================================

  async createReturn(
    investorId: string,
    createReturnDto: CreateReturnDto,
  ) {
    const investor =
      await this.investorModel.findById(investorId);

    if (!investor) {
      throw new NotFoundException('Investor not found');
    }

    if (!investor.isActive) {
      throw new BadRequestException(
        'This investor is inactive',
      );
    }

    if (
      !createReturnDto.amount ||
      createReturnDto.amount <= 0
    ) {
      throw new BadRequestException(
        'Return amount must be greater than 0',
      );
    }

    // --------------------------------------------
    // Update investor balance
    // --------------------------------------------

    const balanceBefore = investor.balance;

    investor.balance -= createReturnDto.amount;

    await investor.save();

    // --------------------------------------------
    // Create return transaction
    // --------------------------------------------

    const transaction =
      new this.investorTransactionModel({
        investor: investor._id,

        investorName: investor.name,

        investorLocation: investor.location ?? '',

        type: 'return',

        amount: createReturnDto.amount,

        balanceBefore,

        paymentMethod: createReturnDto.paymentMethod,

        note: createReturnDto.note,

        ...(createReturnDto.transactionDate
          ? {
              transactionDate:
                createReturnDto.transactionDate,
            }
          : {}),

        balanceAfter: investor.balance,
      });

    await transaction.save();

    return {
      message: 'Return recorded successfully',
      transaction,
      investorBalance: investor.balance,
    };
  }

  // ============================================
  // GET INVESTOR LEDGER
  // ============================================

  async getLedger(investorId: string) {
    const investor =
      await this.investorModel.findById(investorId).exec();

    if (!investor) {
      throw new NotFoundException('Investor not found');
    }

    const investorObjectId =
      new Types.ObjectId(investorId);

    const transactions =
      await this.investorTransactionModel
        .find({
          investor: investorObjectId,
        })
        .sort({
          transactionDate: -1,
          createdAt: -1,
        })
        .exec();

    return {
      investor,
      currentBalance: investor.balance,
      transactions,
    };
  }
}
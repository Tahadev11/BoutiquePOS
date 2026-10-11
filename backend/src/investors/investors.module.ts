import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { InvestorsController } from './investors.controller';
import { InvestorsService } from './investors.service';

import {
  Investor,
  InvestorSchema,
} from './schemas/investor.schema';

import {
  InvestorTransaction,
  InvestorTransactionSchema,
} from './transactions/schemas/investor-transaction.schema';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Investor.name,
        schema: InvestorSchema,
      },
      {
        name: InvestorTransaction.name,
        schema: InvestorTransactionSchema,
      },
    ]),

    PassportModule.register({}),

    AuthModule,
  ],

  controllers: [
    InvestorsController,
  ],

  providers: [
    InvestorsService,
  ],
})
export class InvestorsModule {}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

import {
  Employee,
  EmployeeSchema,
} from './schemas/employee.schema';

import {
  EmployeeTransaction,
  EmployeeTransactionSchema,
} from './transactions/schemas/employee-transaction.schema';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
      {
        name: EmployeeTransaction.name,
        schema: EmployeeTransactionSchema,
      },
    ]),

    PassportModule.register({}),

    AuthModule,
  ],

  controllers: [
    EmployeesController,
  ],

  providers: [
    EmployeesService,
  ],
})
export class EmployeesModule {}
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import {
  Supplier,
  SupplierDocument,
} from './schemas/supplier.schema';

import {
  SupplierTransaction,
  SupplierTransactionDocument,
} from './transactions/schemas/supplier-transaction.schema';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreatePurchaseDto } from './transactions/dto/create-purchase.dto';
import { CreatePaymentDto } from './transactions/dto/create-payment.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name)
    private supplierModel: Model<SupplierDocument>,

    @InjectModel(SupplierTransaction.name)
    private supplierTransactionModel: Model<SupplierTransactionDocument>,

    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  // ============================================
  // CREATE SUPPLIER
  // ============================================

  async create(createSupplierDto: CreateSupplierDto) {
    const supplier = new this.supplierModel({
      name: createSupplierDto.name,
      location: createSupplierDto.location ?? '',
      balance: createSupplierDto.balance ?? 0,
      isActive: true,
    });

    return supplier.save();
  }

  // ============================================
  // GET ALL SUPPLIERS
  // ============================================

  async findAll() {
    return this.supplierModel
      .find()
      .sort({
        isActive: -1,
        createdAt: -1,
      })
      .exec();
  }

  // ============================================
  // GET SINGLE SUPPLIER
  // ============================================

  async findOne(id: string) {
    const supplier =
      await this.supplierModel
        .findById(id)
        .exec();

    if (!supplier) {
      throw new NotFoundException(
        'Supplier not found',
      );
    }

    return supplier;
  }

  // ============================================
  // UPDATE SUPPLIER
  // ============================================

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
  ) {
    const supplier =
      await this.supplierModel.findById(id);

    if (!supplier) {
      throw new NotFoundException(
        'Supplier not found',
      );
    }

    if (
      updateSupplierDto.name !== undefined
    ) {
      supplier.name =
        updateSupplierDto.name;
    }

    if (
      updateSupplierDto.location !== undefined
    ) {
      supplier.location =
        updateSupplierDto.location;
    }

    if (
      updateSupplierDto.isActive !== undefined
    ) {
      supplier.isActive =
        updateSupplierDto.isActive;
    }

    // Balance is intentionally NOT editable.
    // It can only change through purchases/payments.

    return supplier.save();
  }

  // ============================================
  // DELETE SUPPLIER
  // ============================================

  async remove(id: string) {
    const supplier =
      await this.supplierModel.findById(id);

    if (!supplier) {
      throw new NotFoundException(
        'Supplier not found',
      );
    }

    // A supplier with an outstanding balance
    // cannot be permanently deleted.
    if (supplier.balance > 0) {
      throw new BadRequestException(
        'Supplier cannot be deleted while balance is greater than 0. Clear the supplier balance first, then delete the supplier.',
      );
    }

    const transactionCount =
      await this.supplierTransactionModel.countDocuments({
        supplier: supplier._id,
      });

    if (transactionCount > 0) {
      throw new BadRequestException(
        'Supplier cannot be deleted because transaction history exists. Deactivate the supplier instead.',
      );
    }

    await this.supplierModel.deleteOne({
      _id: supplier._id,
    });

    return {
      message: 'Supplier deleted successfully',
    };
  }

  // ============================================
  // CREATE PURCHASE
  // ============================================

  async createPurchase(
    supplierId: string,
    createPurchaseDto: CreatePurchaseDto,
  ) {
    const supplier =
      await this.supplierModel.findById(
        supplierId,
      );

    if (!supplier) {
      throw new NotFoundException(
        'Supplier not found',
      );
    }

    if (!supplier.isActive) {
      throw new BadRequestException(
        'This supplier is inactive',
      );
    }

    if (
      !createPurchaseDto.items ||
      createPurchaseDto.items.length === 0
    ) {
      throw new BadRequestException(
        'Purchase must contain at least one product',
      );
    }

    // --------------------------------------------
    // Prevent duplicate products
    // --------------------------------------------

    const productIds =
      createPurchaseDto.items.map(
        item => item.productId,
      );

    const uniqueProductIds =
      new Set(productIds);

    if (
      uniqueProductIds.size !==
      productIds.length
    ) {
      throw new BadRequestException(
        'The same product cannot be added twice in one purchase',
      );
    }

    // --------------------------------------------
    // Find products
    // --------------------------------------------

    const products =
      await this.productModel.find({
        _id: {
          $in: productIds,
        },
      });

    if (
      products.length !==
      productIds.length
    ) {
      throw new BadRequestException(
        'One or more products were not found',
      );
    }

    // --------------------------------------------
    // Calculate purchase
    // --------------------------------------------

    let totalAmount = 0;

    const purchaseItems = [];

    for (
      const item
      of createPurchaseDto.items
    ) {
      const product =
        products.find(
          product =>
            product._id.toString() ===
            item.productId,
        );

      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} not found`,
        );
      }

      const subtotal =
        item.quantity *
        item.purchasePrice;

      totalAmount += subtotal;

      // Store product information as a snapshot.
      // This preserves the historical purchase
      // information even if the product changes later.

      purchaseItems.push({
        product: product._id,
        dressName: product.dressName,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        subtotal,
      });

      // Increase stock
      product.stockQuantity +=
        item.quantity;

      // Store latest purchase price
      product.purchasePrice =
        item.purchasePrice;

      await product.save();
    }

    // --------------------------------------------
    // Update supplier balance
    // --------------------------------------------

    const balanceBefore =
      supplier.balance;

    supplier.balance +=
      totalAmount;

    await supplier.save();

    // --------------------------------------------
    // Determine transaction date
    // --------------------------------------------

    const transactionDate =
      createPurchaseDto.transactionDate
        ? new Date(
            createPurchaseDto.transactionDate,
          )
        : new Date();

    // --------------------------------------------
    // Create purchase transaction
    // --------------------------------------------

    const transaction =
      new this.supplierTransactionModel({
        supplier: supplier._id,

        supplierName:
          supplier.name,

        supplierLocation:
          supplier.location ?? '',

        type: 'purchase',

        amount:
          totalAmount,

        balanceBefore,

        items:
          purchaseItems,

        note:
          createPurchaseDto.note,

        transactionDate,

        balanceAfter:
          supplier.balance,
      });

    await transaction.save();

    return {
      message:
        'Purchase recorded successfully',

      transaction,

      supplierBalance:
        supplier.balance,
    };
  }

  // ============================================
  // CREATE PAYMENT
  // ============================================

  async createPayment(
    supplierId: string,
    createPaymentDto: CreatePaymentDto,
  ) {
    const supplier =
      await this.supplierModel.findById(
        supplierId,
      );

    if (!supplier) {
      throw new NotFoundException(
        'Supplier not found',
      );
    }

    if (!supplier.isActive) {
      throw new BadRequestException(
        'This supplier is inactive',
      );
    }

    // --------------------------------------------
    // Validate payment amount
    // --------------------------------------------

    if (
      createPaymentDto.amount >
      supplier.balance
    ) {
      throw new BadRequestException(
        'Payment cannot be greater than supplier balance',
      );
    }

    // --------------------------------------------
    // Update supplier balance
    // --------------------------------------------

    const balanceBefore =
      supplier.balance;

    supplier.balance -=
      createPaymentDto.amount;

    await supplier.save();

    // --------------------------------------------
    // Determine transaction date
    // --------------------------------------------

    const transactionDate =
      createPaymentDto.transactionDate
        ? new Date(
            createPaymentDto.transactionDate,
          )
        : new Date();

    // --------------------------------------------
    // Create payment transaction
    // --------------------------------------------

    const transaction =
      new this.supplierTransactionModel({
        supplier: supplier._id,

        supplierName:
          supplier.name,

        supplierLocation:
          supplier.location ?? '',

        type: 'payment',

        amount:
          createPaymentDto.amount,

        balanceBefore,

        paymentMethod:
          createPaymentDto.paymentMethod,

        note:
          createPaymentDto.note,

        transactionDate,

        balanceAfter:
          supplier.balance,
      });

    await transaction.save();

    return {
      message:
        'Payment recorded successfully',

      transaction,

      supplierBalance:
        supplier.balance,
    };
  }

  // ============================================
  // GET SUPPLIER LEDGER
  // ============================================

  async getLedger(supplierId: string) {
    const supplier =
      await this.supplierModel
        .findById(supplierId)
        .exec();

    if (!supplier) {
      throw new NotFoundException(
        'Supplier not found',
      );
    }

    const supplierObjectId =
      new Types.ObjectId(supplierId);

    // --------------------------------------------
    // Get supplier transactions
    // --------------------------------------------
    //
    // New transactions have transactionDate.
    //
    // Old transactions may not have transactionDate,
    // so createdAt is also used as a fallback.

    const transactions =
      await this.supplierTransactionModel
        .find({
          supplier: supplierObjectId,
        })
        .sort({
          transactionDate: -1,
          createdAt: -1,
        })
        .exec();

    return {
      supplier,

      currentBalance:
        supplier.balance,

      transactions,
    };
  }
}
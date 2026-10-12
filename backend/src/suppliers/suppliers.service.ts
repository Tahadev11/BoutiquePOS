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
import { CreateReturnDto } from './transactions/dto/create-return.dto';

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
    //
    // Balance can only change through:
    // - Purchases
    // - Payments

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

    // --------------------------------------------
    // Supplier must have exactly zero balance
    // --------------------------------------------
    //
    // Positive balance:
    //   We still owe supplier.
    //
    // Negative balance:
    //   Supplier has our advance.
    //
    // Both cases mean the account is NOT settled.
    //
    // Therefore deletion is allowed ONLY when:
    //
    // balance === 0
    // --------------------------------------------

    if (supplier.balance !== 0) {
      if (supplier.balance > 0) {
        throw new BadRequestException(
          'Supplier cannot be deleted while there is an outstanding payable balance. Clear the supplier balance first.',
        );
      }

      throw new BadRequestException(
        'Supplier cannot be deleted while an advance exists. The supplier advance must be settled first.',
      );
    }

    // --------------------------------------------
    // Check transaction history
    // --------------------------------------------

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

      // ------------------------------------------
      // Store product snapshot
      // ------------------------------------------

      purchaseItems.push({
        product: product._id,
        dressName: product.dressName,
        brand: product.brand ?? '',
        category: product.category ?? '',
        size: product.size ?? '',
        color: product.color ?? '',
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        subtotal,
      });

      // ------------------------------------------
      // Increase stock
      // ------------------------------------------

      product.stockQuantity +=
        item.quantity;

      // ------------------------------------------
      // Store latest purchase price
      // ------------------------------------------

      product.purchasePrice =
        item.purchasePrice;

      await product.save();
    }

    // --------------------------------------------
    // Update supplier balance
    // --------------------------------------------
    //
    // Purchase always increases the amount
    // payable to the supplier.
    //
    // Example:
    //
    // Current balance = -10,000
    // Purchase        = 25,000
    //
    // New balance     = 15,000
    //
    // The previous advance is automatically
    // adjusted against the purchase.
    // --------------------------------------------

    const balanceBefore =
      supplier.balance;

    supplier.balance +=
      totalAmount;

    await supplier.save();

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

        // Save selected transaction date.
        // If frontend does not provide one,
        // the schema/default date can be used.
        ...(createPurchaseDto.transactionDate
          ? {
              transactionDate:
                createPurchaseDto.transactionDate,
            }
          : {}),

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
      !createPaymentDto.amount ||
      createPaymentDto.amount <= 0
    ) {
      throw new BadRequestException(
        'Payment amount must be greater than 0',
      );
    }

    // --------------------------------------------
    // Update supplier balance
    // --------------------------------------------
    //
    // Positive balance:
    //   Amount payable to supplier.
    //
    // Zero:
    //   Account settled.
    //
    // Negative balance:
    //   Advance paid to supplier.
    //
    // Example:
    //
    // Balance = 50,000
    // Payment  = 60,000
    //
    // New balance = -10,000
    //
    // The Rs. 10,000 becomes an advance.
    // --------------------------------------------

    const balanceBefore =
      supplier.balance;

    supplier.balance -=
      createPaymentDto.amount;

    await supplier.save();

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

        // Save selected transaction date.
        ...(createPaymentDto.transactionDate
          ? {
              transactionDate:
                createPaymentDto.transactionDate,
            }
          : {}),

        balanceAfter:
          supplier.balance,
      });

    await transaction.save();

    // --------------------------------------------
    // Return response
    // --------------------------------------------

    return {
      message:
        'Payment recorded successfully',

      transaction,

      supplierBalance:
        supplier.balance,
    };
  }

    // ============================================
  // CREATE RETURN
  // ============================================

  async createReturn(
    supplierId: string,
    createReturnDto: CreateReturnDto,
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
      !createReturnDto.items ||
      createReturnDto.items.length === 0
    ) {
      throw new BadRequestException(
        'Return must contain at least one product',
      );
    }

    // --------------------------------------------
    // Prevent duplicate products
    // --------------------------------------------

    const productIds =
      createReturnDto.items.map(
        item => item.productId,
      );

    const uniqueProductIds =
      new Set(productIds);

    if (
      uniqueProductIds.size !==
      productIds.length
    ) {
      throw new BadRequestException(
        'The same product cannot be added twice in one return',
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
    // Calculate return
    // --------------------------------------------

    let totalAmount = 0;

    const returnItems = [];

    for (
      const item
      of createReturnDto.items
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

      // ------------------------------------------
      // Stock check
      // ------------------------------------------
      //
      // You cannot return more than what you
      // currently have in stock.
      // ------------------------------------------

      if (
        product.stockQuantity <
        item.quantity
      ) {
        throw new BadRequestException(
          `Not enough stock for ${product.dressName}. Available: ${product.stockQuantity}, requested: ${item.quantity}`,
        );
      }

      const subtotal =
        item.quantity *
        item.returnPrice;

      totalAmount += subtotal;

      // ------------------------------------------
      // Store product snapshot
      // ------------------------------------------

      returnItems.push({
        product: product._id,
        dressName: product.dressName,
        brand: product.brand ?? '',
        category: product.category ?? '',
        size: product.size ?? '',
        color: product.color ?? '',
        quantity: item.quantity,
        purchasePrice: item.returnPrice,
        subtotal,
      });

      // ------------------------------------------
      // Decrease stock
      // ------------------------------------------

      product.stockQuantity -=
        item.quantity;

      await product.save();
    }

    // --------------------------------------------
    // Update supplier balance
    // --------------------------------------------
    //
    // Returning dresses reduces the amount
    // we owe the supplier.
    //
    // Example:
    //
    // Balance = 50,000
    // Return  = 10,000
    // New     = 40,000
    //
    // If the return is larger than the
    // outstanding balance, the balance
    // becomes negative — meaning the supplier
    // now owes us (advance).
    // --------------------------------------------

    const balanceBefore =
      supplier.balance;

    supplier.balance -=
      totalAmount;

    await supplier.save();

    // --------------------------------------------
    // Create return transaction
    // --------------------------------------------

    const transaction =
      new this.supplierTransactionModel({
        supplier: supplier._id,

        supplierName:
          supplier.name,

        supplierLocation:
          supplier.location ?? '',

        type: 'return',

        amount:
          totalAmount,

        balanceBefore,

        items:
          returnItems,

        note:
          createReturnDto.note,

        ...(createReturnDto.transactionDate
          ? {
              transactionDate:
                createReturnDto.transactionDate,
            }
          : {}),

        balanceAfter:
          supplier.balance,
      });

    await transaction.save();

    return {
      message:
        'Return recorded successfully',

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
    // Transactions are sorted by:
    //
    // 1. transactionDate
    // 2. createdAt
    //
    // Older transactions without transactionDate
    // will still use createdAt as fallback ordering.
    // --------------------------------------------

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
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Sale,
  SaleDocument,
} from './schemas/sale.schema';

import {
  ReturnExchange,
  ReturnExchangeDocument,
} from './schemas/return-exchange.schema';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

import { CheckoutDto } from './dto/checkout.dto';

import {
  CreateReturnExchangeDto,
} from './dto/return-exchange.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,

    @InjectModel(ReturnExchange.name)
    private readonly returnExchangeModel: Model<ReturnExchangeDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  // =========================================================
  // NORMAL CHECKOUT
  // =========================================================

  async checkout(checkoutDto: CheckoutDto) {
    if (
      !checkoutDto.items ||
      checkoutDto.items.length === 0
    ) {
      throw new BadRequestException('Cart is empty');
    }

    const saleItems = [];
    let totalAmount = 0;

    for (const item of checkoutDto.items) {
      const product = await this.productModel
        .findById(item.productId)
        .exec();

      if (!product) {
        throw new NotFoundException(
          `Product ${item.productId} not found`,
        );
      }

      if (
        product.stockQuantity <
        item.quantity
      ) {
        throw new BadRequestException(
          `Not enough stock for ${product.dressName}. Available stock: ${product.stockQuantity}`,
        );
      }

      // Calculate discount
      const discountAmount =
        product.actualPrice *
        (product.discount / 100);

      // Calculate selling price after discount
      const sellingPrice =
        product.actualPrice -
        discountAmount;

      // Calculate subtotal
      const subtotal =
        sellingPrice * item.quantity;

      // Calculate profit
      const profitPerItem =
        sellingPrice -
        product.purchasePrice;

      const totalProfit =
        profitPerItem *
        item.quantity;

      saleItems.push({
        product: product._id,

        dressName:
          product.dressName,

        // Historical product details
        brand:
          product.brand || '',

        category:
          product.category || '',

        size:
          product.size || '',

        color:
          product.color || '',

        quantity:
          item.quantity,

        // Original price before discount
        price:
          product.actualPrice,

        discount:
          product.discount,

        purchasePrice:
          product.purchasePrice,

        profit:
          totalProfit,

        subtotal,
      });

      totalAmount += subtotal;

      // Reduce stock
      product.stockQuantity -=
        item.quantity;

      await product.save();
    }

    // Generate invoice number
    const invoiceNumber =
      await this.generateInvoiceNumber();

    // Create sale/invoice
    const sale =
      new this.saleModel({
        items: saleItems,

        invoiceNumber,

        totalAmount,

        paymentMethod:
          checkoutDto.paymentMethod,
      });

    const savedSale =
      await sale.save();

    return {
      message:
        'Checkout successful',

      invoiceNumber:
        savedSale.invoiceNumber,

      sale:
        savedSale,
    };
  }

  // =========================================================
  // GENERATE NORMAL INVOICE NUMBER
  // =========================================================

  private async generateInvoiceNumber(): Promise<string> {
    const lastSale =
      await this.saleModel
        .findOne()
        .sort({ createdAt: -1 })
        .exec();

    let nextNumber = 1;

    if (
      lastSale?.invoiceNumber
    ) {
      const match =
        lastSale.invoiceNumber.match(
          /(\d+)$/,
        );

      if (match) {
        nextNumber =
          parseInt(
            match[1],
            10,
          ) + 1;
      }
    }

    return `INV-${String(
      nextNumber,
    ).padStart(5, '0')}`;
  }

  // =========================================================
  // FIND ALL SALES
  // =========================================================

  async findAll() {
    return this.saleModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  // =========================================================
  // FIND COMPLETE SALES HISTORY
  // NORMAL SALES + RETURNS + EXCHANGES
  // =========================================================

  async findSalesHistory() {
    const [
      sales,
      returnExchanges,
    ] = await Promise.all([
      this.saleModel
        .find()
        .sort({ createdAt: -1 })
        .lean(),

      this.returnExchangeModel
        .find()
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // =======================================================
    // NORMAL SALES
    // =======================================================

    const saleHistory =
      sales.map((sale: any) => {
        const purchaseCost =
          sale.items?.reduce(
            (
              total: number,
              item: any,
            ) =>
              total +
              Number(
                item.purchasePrice || 0,
              ) *
                Number(
                  item.quantity || 0,
                ),
            0,
          ) || 0;

        const profit =
          sale.items?.reduce(
            (
              total: number,
              item: any,
            ) =>
              total +
              Number(
                item.profit || 0,
              ),
            0,
          ) || 0;

        return {
          _id:
            sale._id,

          historyType:
            'sale',

          documentNumber:
            sale.invoiceNumber,

          originalInvoiceNumber:
            null,

          createdAt:
            sale.createdAt,

          items:
            sale.items || [],

          paymentMethod:
            sale.paymentMethod || '',

          amount:
            Number(
              sale.totalAmount || 0,
            ),

          purchaseCost,

          profit,
        };
      });

    // =======================================================
    // RETURNS / EXCHANGES
    // =======================================================

    const returnExchangeHistory =
      returnExchanges.map(
        (transaction: any) => {
          const items: any[] = [];

          // -------------------------------------------------
          // COMPLETE RETURNS
          // -------------------------------------------------

          for (
            const item of
              transaction.returnedItems || []
          ) {
            items.push({
              dressName:
                item.dressName,

              quantity:
                item.quantity,
            });
          }

          // -------------------------------------------------
          // EXCHANGES
          //
          // Supports:
          // 1. New format:
          //    replacementItems[]
          //
          // 2. Old format:
          //    replacementDressName
          //    replacementQuantity
          // -------------------------------------------------

          for (
            const item of
              transaction.exchangeItems || []
          ) {
            // New exchange format
            if (
              Array.isArray(
                item.replacementItems,
              ) &&
              item.replacementItems.length >
                0
            ) {
              const replacementNames =
                item.replacementItems
                  .map(
                    (replacement: any) =>
                      `${replacement.dressName} × ${replacement.quantity}`,
                  )
                  .join(', ');

              items.push({
                dressName:
                  `${item.returnedDressName} → ${replacementNames}`,

                quantity:
                  item.returnedQuantity,
              });
            }

            // Old exchange format
            else if (
              item.replacementDressName
            ) {
              items.push({
                dressName:
                  `${item.returnedDressName} → ${item.replacementDressName}`,

                quantity:
                  item.replacementQuantity,
              });
            }
          }

          return {
            _id:
              transaction._id,

            historyType:
              transaction.type ===
              'return'
                ? 'return'
                : 'exchange',

            documentNumber:
              transaction.documentNumber,

            originalInvoiceNumber:
              transaction.originalInvoiceNumber,

            createdAt:
              transaction.createdAt,

            items,

            paymentMethod:
              transaction.paymentMethod ||
              '',

            amount:
              Number(
                transaction.netAmount || 0,
              ),

            purchaseCost:
              Number(
                transaction.netCost || 0,
              ),

            profit:
              Number(
                transaction.netProfit || 0,
              ),

            refundAmount:
              Number(
                transaction.refundAmount ||
                  0,
              ),

            additionalPayment:
              Number(
                transaction.additionalPayment ||
                  0,
              ),
          };
        },
      );

    // =======================================================
    // COMBINE + SORT
    // =======================================================

    return [
      ...saleHistory,
      ...returnExchangeHistory,
    ].sort(
      (a, b) =>
        new Date(
          b.createdAt,
        ).getTime() -
        new Date(
          a.createdAt,
        ).getTime(),
    );
  }

  // =========================================================
  // FIND ONE SALE BY MONGODB ID
  // =========================================================

  async findOne(id: string) {
    const sale =
      await this.saleModel
        .findById(id)
        .exec();

    if (!sale) {
      throw new NotFoundException(
        'Sale not found',
      );
    }

    return sale;
  }

  // =========================================================
  // FIND ORIGINAL INVOICE
  // =========================================================

  async findByInvoiceNumber(
    invoiceNumber: string,
  ) {
    const sale =
      await this.saleModel
        .findOne({
          invoiceNumber:
            invoiceNumber.trim(),
        })
        .lean()
        .exec();

    if (!sale) {
      throw new NotFoundException(
        `Invoice ${invoiceNumber} not found`,
      );
    }

    // =======================================================
    // LOAD PRODUCT DETAILS FOR OLD INVOICES
    // =======================================================

    const updatedItems =
      await Promise.all(
        (sale.items || []).map(
          async (item: any) => {
            // If invoice already contains
            // complete snapshot, keep it.
            if (
              item.brand &&
              item.category &&
              item.size &&
              item.color
            ) {
              return item;
            }

            const productId =
              item.product?._id ||
              item.product;

            if (!productId) {
              return item;
            }

            const product =
              await this.productModel
                .findById(productId)
                .lean()
                .exec();

            if (!product) {
              return item;
            }

            return {
              ...item,

              brand:
                item.brand ??
                product.brand ??
                '',

              category:
                item.category ??
                product.category ??
                '',

              size:
                item.size ??
                product.size ??
                '',

              color:
                item.color ??
                product.color ??
                '',
            };
          },
        ),
      );

    return {
      ...sale,
      items:
        updatedItems,
    };
  }

  // =========================================================
  // GENERATE RETURN NUMBER
  // =========================================================

  private async generateReturnNumber(): Promise<string> {
    const lastTransaction =
      await this.returnExchangeModel
        .findOne({
          documentNumber:
            /^RET-/,
        })
        .sort({
          createdAt: -1,
        })
        .exec();

    let nextNumber = 1;

    if (
      lastTransaction?.documentNumber
    ) {
      const match =
        lastTransaction.documentNumber.match(
          /(\d+)$/,
        );

      if (match) {
        nextNumber =
          parseInt(
            match[1],
            10,
          ) + 1;
      }
    }

    return `RET-${String(
      nextNumber,
    ).padStart(5, '0')}`;
  }

  // =========================================================
  // GENERATE EXCHANGE NUMBER
  // =========================================================

  private async generateExchangeNumber(): Promise<string> {
    const lastTransaction =
      await this.returnExchangeModel
        .findOne({
          documentNumber:
            /^EX-/,
        })
        .sort({
          createdAt: -1,
        })
        .exec();

    let nextNumber = 1;

    if (
      lastTransaction?.documentNumber
    ) {
      const match =
        lastTransaction.documentNumber.match(
          /(\d+)$/,
        );

      if (match) {
        nextNumber =
          parseInt(
            match[1],
            10,
          ) + 1;
      }
    }

    return `EX-${String(
      nextNumber,
    ).padStart(5, '0')}`;
  }

  // =========================================================
  // CREATE RETURN / EXCHANGE
  // =========================================================

  async createReturnExchange(
    dto: CreateReturnExchangeDto,
  ) {
    const returnedItems =
      dto.returnedItems || [];

    const exchangeItems =
      dto.exchangeItems || [];

    // =======================================================
    // BASIC VALIDATION
    // =======================================================

    if (
      returnedItems.length === 0 &&
      exchangeItems.length === 0
    ) {
      throw new BadRequestException(
        'Please select at least one item to return or exchange',
      );
    }

    // =======================================================
    // FIND ORIGINAL INVOICE
    // =======================================================

    const sale =
      await this.saleModel
        .findOne({
          invoiceNumber:
            dto.originalInvoiceNumber.trim(),
        })
        .exec();

    if (!sale) {
      throw new NotFoundException(
        `Invoice ${dto.originalInvoiceNumber} not found`,
      );
    }

    // =======================================================
    // PREVENT DUPLICATE RETURNED PRODUCT
    // IN SAME TRANSACTION
    // =======================================================

    const returnedProductIds =
      returnedItems.map(
        (item) =>
          item.productId,
      );

    const exchangedProductIds =
      exchangeItems.map(
        (item) =>
          item.returnedProductId,
      );

    const allReturnedProductIds = [
      ...returnedProductIds,
      ...exchangedProductIds,
    ];

    const uniqueReturnedProductIds =
      new Set(
        allReturnedProductIds,
      );

    if (
      uniqueReturnedProductIds.size !==
      allReturnedProductIds.length
    ) {
      throw new BadRequestException(
        'The same product cannot be selected for return/exchange more than once in the same transaction',
      );
    }

    // =======================================================
    // VALIDATE EXCHANGE REPLACEMENT LIST
    // =======================================================

    for (
      const exchangeItem of exchangeItems
    ) {
      if (
        !exchangeItem.replacementItems ||
        exchangeItem.replacementItems.length ===
          0
      ) {
        throw new BadRequestException(
          'Each exchange must have at least one replacement dress',
        );
      }

      // Prevent duplicate replacement products
      // inside the same exchange.
      const replacementIds =
        exchangeItem.replacementItems.map(
          (replacement) =>
            replacement.productId,
        );

      const uniqueReplacementIds =
        new Set(
          replacementIds,
        );

      if (
        uniqueReplacementIds.size !==
        replacementIds.length
      ) {
        throw new BadRequestException(
          'The same replacement product cannot be selected more than once in the same exchange',
        );
      }
    }

    // =======================================================
    // FIND PREVIOUS RETURN / EXCHANGE TRANSACTIONS
    // =======================================================

    const previousTransactions =
      await this.returnExchangeModel
        .find({
          originalSale:
            sale._id,
        })
        .exec();

    // =======================================================
    // CALCULATE ALREADY PROCESSED QUANTITY
    //
    // This tracks how many units of each ORIGINAL
    // invoice product have already been returned/exchanged.
    // =======================================================

    const alreadyProcessed =
      new Map<string, number>();

    for (
      const transaction of
        previousTransactions
    ) {
      // -----------------------------------------------------
      // COMPLETE RETURNS
      // -----------------------------------------------------

      for (
        const item of
          transaction.returnedItems || []
      ) {
        const productId =
          item.product.toString();

        const current =
          alreadyProcessed.get(
            productId,
          ) || 0;

        alreadyProcessed.set(
          productId,
          current +
            Number(
              item.quantity || 0,
            ),
        );
      }

      // -----------------------------------------------------
      // EXCHANGE RETURN SIDE
      // -----------------------------------------------------

      for (
        const item of
          transaction.exchangeItems || []
      ) {
        const productId =
          item.returnedProduct.toString();

        const current =
          alreadyProcessed.get(
            productId,
          ) || 0;

        alreadyProcessed.set(
          productId,
          current +
            Number(
              item.returnedQuantity ||
                0,
            ),
        );
      }
    }

    // =======================================================
    // HELPER: FIND ORIGINAL SALE ITEM
    // =======================================================

    const findOriginalSaleItem = (
      productId: string,
    ) => {
      return sale.items.find(
        (item) =>
          item.product.toString() ===
          productId,
      );
    };

    // =======================================================
    // PREPARE RESULT ARRAYS
    // =======================================================

    const savedReturnItems: any[] =
      [];

    const savedExchangeItems: any[] =
      [];

    let returnAmount = 0;
    let exchangeAmount = 0;

    let returnedCost = 0;
    let replacementCost = 0;

    let returnedProfit = 0;
    let replacementProfit = 0;

    // =======================================================
    // PROCESS COMPLETE RETURNS
    // =======================================================

    for (
      const item of returnedItems
    ) {
      const originalItem =
        findOriginalSaleItem(
          item.productId,
        );

      if (!originalItem) {
        throw new BadRequestException(
          `Product ${item.productId} does not exist on invoice ${sale.invoiceNumber}`,
        );
      }

      const alreadyReturned =
        alreadyProcessed.get(
          item.productId,
        ) || 0;

      const remainingQuantity =
        Number(
          originalItem.quantity,
        ) -
        alreadyReturned;

      if (
        item.quantity >
        remainingQuantity
      ) {
        throw new BadRequestException(
          `${originalItem.dressName}: only ${remainingQuantity} quantity is available for return/exchange`,
        );
      }

      const originalSellingPrice =
        this.calculateOriginalSellingPrice(
          originalItem,
        );

      const subtotal =
        originalSellingPrice *
        item.quantity;

      const purchaseCost =
        Number(
          originalItem.purchasePrice || 0,
        ) *
        item.quantity;

      const profitPerItem =
        Number(
          originalItem.profit || 0,
        ) /
        Number(
          originalItem.quantity || 1,
        );

      const profit =
        profitPerItem *
        item.quantity;

      savedReturnItems.push({
        product:
          originalItem.product,

        dressName:
          originalItem.dressName,

        quantity:
          item.quantity,

        price:
          originalSellingPrice,

        purchasePrice:
          originalItem.purchasePrice,

        subtotal,

        profit,
      });

      returnAmount +=
        subtotal;

      returnedCost +=
        purchaseCost;

      returnedProfit +=
        profit;

      // -----------------------------------------------------
      // PUT RETURNED PRODUCT BACK INTO STOCK
      // -----------------------------------------------------

      const product =
        await this.productModel
          .findById(
            item.productId,
          )
          .exec();

      if (!product) {
        throw new NotFoundException(
          `Product ${item.productId} not found`,
        );
      }

      product.stockQuantity +=
        item.quantity;

      await product.save();
    }

    // =======================================================
    // PROCESS EXCHANGES
    //
    // ONE RETURNED DRESS CAN HAVE MULTIPLE REPLACEMENTS
    //
    // Example:
    //
    // Returned:
    // Dress A × 1
    //
    // Replacement:
    // Dress B × 1
    // Dress C × 2
    // =======================================================

    for (
      const item of exchangeItems
    ) {
      const originalItem =
        findOriginalSaleItem(
          item.returnedProductId,
        );

      if (!originalItem) {
        throw new BadRequestException(
          `Returned product ${item.returnedProductId} does not exist on invoice ${sale.invoiceNumber}`,
        );
      }

      // -----------------------------------------------------
      // CHECK REMAINING ORIGINAL QUANTITY
      // -----------------------------------------------------

      const alreadyReturned =
        alreadyProcessed.get(
          item.returnedProductId,
        ) || 0;

      const remainingQuantity =
        Number(
          originalItem.quantity,
        ) -
        alreadyReturned;

      if (
        item.returnedQuantity >
        remainingQuantity
      ) {
        throw new BadRequestException(
          `${originalItem.dressName}: only ${remainingQuantity} quantity is available for exchange`,
        );
      }

      // -----------------------------------------------------
      // EXCHANGE MUST HAVE REPLACEMENTS
      // -----------------------------------------------------

      if (
        !item.replacementItems ||
        item.replacementItems.length ===
          0
      ) {
        throw new BadRequestException(
          `Please select at least one replacement dress for ${originalItem.dressName}`,
        );
      }

      // -----------------------------------------------------
      // DUPLICATE REPLACEMENT CHECK
      // -----------------------------------------------------

      const replacementIds =
        item.replacementItems.map(
          (replacement) =>
            replacement.productId,
        );

      const uniqueReplacementIds =
        new Set(
          replacementIds,
        );

      if (
        uniqueReplacementIds.size !==
        replacementIds.length
      ) {
        throw new BadRequestException(
          `The same replacement product cannot be selected more than once for ${originalItem.dressName}`,
        );
      }

      // -----------------------------------------------------
      // RETURNED ITEM CALCULATIONS
      // -----------------------------------------------------

      const returnedPrice =
        this.calculateOriginalSellingPrice(
          originalItem,
        );

      const returnedSubtotal =
        returnedPrice *
        item.returnedQuantity;

      const returnedPurchaseCost =
        Number(
          originalItem.purchasePrice || 0,
        ) *
        item.returnedQuantity;

      const returnedItemProfit =
        (
          Number(
            originalItem.profit || 0,
          ) /
          Number(
            originalItem.quantity || 1,
          )
        ) *
        item.returnedQuantity;

      // -----------------------------------------------------
      // MULTIPLE REPLACEMENT ITEMS
      // -----------------------------------------------------

      const savedReplacementItems: any[] =
        [];

      for (
        const replacementItem of
          item.replacementItems
      ) {
        // Replacement cannot be the same
        // as the returned product.
        if (
          replacementItem.productId ===
          item.returnedProductId
        ) {
          throw new BadRequestException(
            'Replacement product must be different from the returned product',
          );
        }

        // Find replacement product
        const replacementProduct =
          await this.productModel
            .findById(
              replacementItem.productId,
            )
            .exec();

        if (!replacementProduct) {
          throw new NotFoundException(
            `Replacement product ${replacementItem.productId} not found`,
          );
        }

        // ---------------------------------------------------
        // CHECK STOCK
        // ---------------------------------------------------

        if (
          replacementProduct.stockQuantity <
          replacementItem.quantity
        ) {
          throw new BadRequestException(
            `Not enough stock for ${replacementProduct.dressName}. Available stock: ${replacementProduct.stockQuantity}`,
          );
        }

        // ---------------------------------------------------
        // CALCULATE CURRENT SELLING PRICE
        // ---------------------------------------------------

        const replacementSellingPrice =
          this.calculateCurrentSellingPrice(
            replacementProduct,
          );

        const replacementSubtotal =
          replacementSellingPrice *
          replacementItem.quantity;

        const replacementPurchaseCost =
          Number(
            replacementProduct.purchasePrice ||
              0,
          ) *
          replacementItem.quantity;

        const replacementItemProfit =
          (
            replacementSellingPrice -
            Number(
              replacementProduct.purchasePrice ||
                0,
            )
          ) *
          replacementItem.quantity;

        // ---------------------------------------------------
        // SAVE REPLACEMENT SNAPSHOT
        // ---------------------------------------------------

        savedReplacementItems.push({
          product:
            replacementProduct._id,

          dressName:
            replacementProduct.dressName,

          quantity:
            replacementItem.quantity,

          price:
            replacementSellingPrice,

          purchasePrice:
            replacementProduct.purchasePrice,

          subtotal:
            replacementSubtotal,
        });

        // ---------------------------------------------------
        // ADD FINANCIAL VALUES
        // ---------------------------------------------------

        exchangeAmount +=
          replacementSubtotal;

        replacementCost +=
          replacementPurchaseCost;

        replacementProfit +=
          replacementItemProfit;

        // ---------------------------------------------------
        // REMOVE REPLACEMENT FROM STOCK
        // ---------------------------------------------------

        replacementProduct.stockQuantity -=
          replacementItem.quantity;

        await replacementProduct.save();
      }

      // -----------------------------------------------------
      // SAVE COMPLETE EXCHANGE SNAPSHOT
      // -----------------------------------------------------

      savedExchangeItems.push({
        returnedProduct:
          originalItem.product,

        returnedDressName:
          originalItem.dressName,

        returnedQuantity:
          item.returnedQuantity,

        returnedPrice,

        returnedPurchasePrice:
          originalItem.purchasePrice,

        replacementItems:
          savedReplacementItems,
      });

      // -----------------------------------------------------
      // ADD RETURNED FINANCIAL VALUES
      // -----------------------------------------------------

      returnAmount +=
        returnedSubtotal;

      returnedCost +=
        returnedPurchaseCost;

      returnedProfit +=
        returnedItemProfit;

      // -----------------------------------------------------
      // PUT RETURNED PRODUCT BACK INTO STOCK
      // -----------------------------------------------------

      const returnedProduct =
        await this.productModel
          .findById(
            item.returnedProductId,
          )
          .exec();

      if (!returnedProduct) {
        throw new NotFoundException(
          `Returned product ${item.returnedProductId} not found`,
        );
      }

      returnedProduct.stockQuantity +=
        item.returnedQuantity;

      await returnedProduct.save();
    }

    // =======================================================
    // CALCULATE CUSTOMER SETTLEMENT
    // =======================================================

    let refundAmount = 0;
    let additionalPayment = 0;

    if (
      exchangeAmount >
      returnAmount
    ) {
      additionalPayment =
        exchangeAmount -
        returnAmount;
    } else if (
      returnAmount >
      exchangeAmount
    ) {
      refundAmount =
        returnAmount -
        exchangeAmount;
    }

    // -------------------------------------------------------
    // Positive = customer pays extra
    // Negative = customer gets refund
    // -------------------------------------------------------

    const netAmount =
      exchangeAmount -
      returnAmount;

    // -------------------------------------------------------
    // Positive = additional inventory cost
    // Negative = returned cost exceeds replacement cost
    // -------------------------------------------------------

    const netCost =
      replacementCost -
      returnedCost;

    // -------------------------------------------------------
    // Profit impact
    // -------------------------------------------------------

    const netProfit =
      replacementProfit -
      returnedProfit;

    // =======================================================
    // DETERMINE DOCUMENT TYPE
    // =======================================================

    const hasExchange =
      exchangeItems.length > 0;

    const type =
      hasExchange
        ? 'exchange'
        : 'return';

    // =======================================================
    // GENERATE DOCUMENT NUMBER
    // =======================================================

    const documentNumber =
      hasExchange
        ? await this.generateExchangeNumber()
        : await this.generateReturnNumber();

    // =======================================================
    // SAVE TRANSACTION
    // =======================================================

    const transaction =
      new this.returnExchangeModel({
        documentNumber,

        type,

        originalInvoiceNumber:
          sale.invoiceNumber,

        originalSale:
          sale._id,

        returnedItems:
          savedReturnItems,

        exchangeItems:
          savedExchangeItems,

        returnAmount,

        exchangeAmount,

        refundAmount,

        additionalPayment,

        netAmount,

        netCost,

        netProfit,

        paymentMethod:
          dto.paymentMethod,

        note:
          dto.note || '',
      });

    const savedTransaction =
      await transaction.save();

    // =======================================================
    // RESPONSE
    // =======================================================

    return {
      message:
        hasExchange
          ? 'Exchange completed successfully'
          : 'Return completed successfully',

      documentNumber:
        savedTransaction.documentNumber,

      type:
        savedTransaction.type,

      originalInvoiceNumber:
        savedTransaction.originalInvoiceNumber,

      returnAmount,

      exchangeAmount,

      refundAmount,

      additionalPayment,

      netAmount,

      netCost,

      netProfit,

      transaction:
        savedTransaction,
    };
  }

  // =========================================================
  // ORIGINAL SELLING PRICE
  // =========================================================

  private calculateOriginalSellingPrice(
    saleItem: any,
  ): number {
    const price =
      Number(
        saleItem.price || 0,
      );

    const discount =
      Number(
        saleItem.discount || 0,
      );

    return (
      price -
      price *
        (discount / 100)
    );
  }

  // =========================================================
  // CURRENT PRODUCT SELLING PRICE
  // =========================================================

  private calculateCurrentSellingPrice(
    product: ProductDocument,
  ): number {
    const actualPrice =
      Number(
        product.actualPrice || 0,
      );

    const discount =
      Number(
        product.discount || 0,
      );

    const discountAmount =
      actualPrice *
      (discount / 100);

    return (
      actualPrice -
      discountAmount
    );
  }

  // =========================================================
  // FIND RETURN / EXCHANGE TRANSACTIONS
  // =========================================================

  async findAllReturnExchanges() {
    return this.returnExchangeModel
      .find()
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // =========================================================
  // FIND ONE RETURN / EXCHANGE
  // =========================================================

  async findReturnExchange(
    id: string,
  ) {
    const transaction =
      await this.returnExchangeModel
        .findById(id)
        .exec();

    if (!transaction) {
      throw new NotFoundException(
        'Return/exchange transaction not found',
      );
    }

    return transaction;
  }

  // =========================================================
  // SALES REPORT / SUMMARY
  // =========================================================

  async getSalesSummary(
    startDate?: string,
    endDate?: string,
  ) {
    let start: Date | null = null;
    let end: Date | null = null;

    // =======================================================
    // DATE VALIDATION
    // =======================================================

    if (startDate) {
      start =
        new Date(startDate);

      if (
        isNaN(
          start.getTime(),
        )
      ) {
        throw new BadRequestException(
          'Invalid start date',
        );
      }
    }

    if (endDate) {
      end =
        new Date(endDate);

      if (
        isNaN(
          end.getTime(),
        )
      ) {
        throw new BadRequestException(
          'Invalid end date',
        );
      }
    }

    // =======================================================
    // NORMAL SALES
    // =======================================================

    const saleQuery: any = {};

    if (
      start ||
      end
    ) {
      saleQuery.createdAt = {};

      if (start) {
        saleQuery.createdAt.$gte =
          start;
      }

      if (end) {
        saleQuery.createdAt.$lte =
          end;
      }
    }

    const sales =
      await this.saleModel
        .find(saleQuery)
        .lean();

    let grossSales = 0;
    let grossCost = 0;
    let grossProfit = 0;

    for (
      const sale of sales
    ) {
      grossSales +=
        Number(
          sale.totalAmount,
        ) || 0;

      for (
        const item of
          sale.items || []
      ) {
        const quantity =
          Number(
            item.quantity,
          ) || 0;

        const purchasePrice =
          Number(
            item.purchasePrice,
          ) || 0;

        const profit =
          Number(
            item.profit,
          ) || 0;

        grossCost +=
          purchasePrice *
          quantity;

        grossProfit +=
          profit;
      }
    }

    // =======================================================
    // RETURN / EXCHANGE ADJUSTMENTS
    // =======================================================

    const returnExchangeQuery: any =
      {};

    if (
      start ||
      end
    ) {
      returnExchangeQuery.createdAt =
        {};

      if (start) {
        returnExchangeQuery.createdAt.$gte =
          start;
      }

      if (end) {
        returnExchangeQuery.createdAt.$lte =
          end;
      }
    }

    const returnExchanges =
      await this.returnExchangeModel
        .find(
          returnExchangeQuery,
        )
        .lean();

    let returnExchangeSalesAdjustment =
      0;

    let returnExchangeCostAdjustment =
      0;

    let returnExchangeProfitAdjustment =
      0;

    for (
      const transaction of
        returnExchanges
    ) {
      returnExchangeSalesAdjustment +=
        Number(
          transaction.netAmount,
        ) || 0;

      returnExchangeCostAdjustment +=
        Number(
          transaction.netCost,
        ) || 0;

      returnExchangeProfitAdjustment +=
        Number(
          transaction.netProfit,
        ) || 0;
    }

    // =======================================================
    // ACTUAL / NET VALUES
    // =======================================================

    const netSales =
      grossSales +
      returnExchangeSalesAdjustment;

    const netCost =
      grossCost +
      returnExchangeCostAdjustment;

    const netProfit =
      grossProfit +
      returnExchangeProfitAdjustment;

    // =======================================================
    // RESPONSE
    // =======================================================

    return {
      period: {
        startDate:
          start,

        endDate:
          end,
      },

      // Normal sales before returns/exchanges
      grossSales,

      grossCost,

      grossProfit,

      // Return / exchange impact
      returnExchangeSalesAdjustment,

      returnExchangeCostAdjustment,

      returnExchangeProfitAdjustment,

      // Actual figures after returns/exchanges
      netSales,

      netCost,

      netProfit,

      // Counts
      salesCount:
        sales.length,

      returnExchangeCount:
        returnExchanges.length,
    };
  }
}
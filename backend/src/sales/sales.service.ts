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
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';

import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async checkout(checkoutDto: CheckoutDto) {
    if (!checkoutDto.items || checkoutDto.items.length === 0) {
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

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Not enough stock for ${product.dressName}. Available stock: ${product.stockQuantity}`,
        );
      }

      // Calculate discount
      const discountAmount =
        product.actualPrice * (product.discount / 100);

      // Calculate selling price after discount
      const sellingPrice =
        product.actualPrice - discountAmount;

      // Calculate subtotal
      const subtotal =
        sellingPrice * item.quantity;

      // Calculate profit
      const profitPerItem =
        sellingPrice - product.purchasePrice;

      const totalProfit =
        profitPerItem * item.quantity;

      saleItems.push({
        product: product._id,
        dressName: product.dressName,
        quantity: item.quantity,
        price: product.actualPrice,
        discount: product.discount,
        purchasePrice: product.purchasePrice,
        profit: totalProfit,
        subtotal,
      });

      totalAmount += subtotal;

      // Reduce stock
      product.stockQuantity -= item.quantity;

      await product.save();
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Create sale/invoice
    const sale = new this.saleModel({
      items: saleItems,
      invoiceNumber,
      totalAmount,
      paymentMethod: checkoutDto.paymentMethod,
    });

    const savedSale = await sale.save();

    return {
      message: 'Checkout successful',
      invoiceNumber: savedSale.invoiceNumber,
      sale: savedSale,
    };
  }

  private async generateInvoiceNumber(): Promise<string> {
    const lastSale = await this.saleModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();

    let nextNumber = 1;

    if (lastSale?.invoiceNumber) {
      const match = lastSale.invoiceNumber.match(/(\d+)$/);

      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `INV-${String(nextNumber).padStart(5, '0')}`;
  }

  async findAll() {
    return this.saleModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const sale = await this.saleModel
      .findById(id)
      .exec();

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }
}

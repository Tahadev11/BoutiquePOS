import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Product,
  ProductDocument,
} from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  // Create a new dress
  async create(productData: Partial<Product>) {
    const product = new this.productModel(productData);
    return product.save();
  }

  // Get all dresses
  async findAll() {
    return this.productModel.find().sort({ createdAt: -1 }).exec();
  }
  async search(query: string) {
  return this.productModel
    .find({
      $or: [
        {
          dressName: {
            $regex: query,
            $options: 'i',
          },
        },
        {
          category: {
            $regex: query,
            $options: 'i',
          },
        },
      ],
    })
    .sort({ createdAt: -1 })
    .exec();
}

  // Get one dress
  async findOne(id: string) {
    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException('Dress not found');
    }

    return product;
  }

  // Update a dress
async update(id: string, productData: Partial<Product>) {
  const product = await this.productModel
    .findByIdAndUpdate(
      id,
      productData,
      {
        returnDocument: 'after',
        runValidators: true,
      },
    )
    .exec();

  if (!product) {
    throw new NotFoundException('Dress not found');
  }

  return product;
}

  // Delete a dress
  async remove(id: string) {
    const product = await this.productModel
      .findByIdAndDelete(id)
      .exec();

    if (!product) {
      throw new NotFoundException('Dress not found');
    }

    return {
      message: 'Dress deleted successfully',
    };
  }
}
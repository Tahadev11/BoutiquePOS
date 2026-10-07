import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

// =========================================================
// RETURN ITEM
// =========================================================

export class ReturnItemDto {
  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

// =========================================================
// REPLACEMENT ITEM
// =========================================================
// A single replacement product.
//
// Example:
// Dress B × 2
// Dress C × 1
//
// Multiple ReplacementItemDto objects can be placed
// inside one ExchangeItemDto.
// =========================================================

export class ReplacementItemDto {
  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

// =========================================================
// EXCHANGE ITEM
// =========================================================
// One returned product can now have MULTIPLE replacement
// products.
//
// Example:
//
// Returned:
// Dress A × 1
//
// Replacements:
// Dress B × 1
// Dress C × 1
//
// This allows:
// - One returned dress → multiple dresses
// - One returned dress → same replacement with quantity > 1
// - Multiple replacement products in one exchange
// =========================================================

export class ExchangeItemDto {
  // -------------------------------------------------------
  // Product being returned
  // -------------------------------------------------------

  @IsMongoId()
  returnedProductId: string;

  @IsInt()
  @Min(1)
  returnedQuantity: number;

  // -------------------------------------------------------
  // Products customer wants instead
  // -------------------------------------------------------

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplacementItemDto)
  replacementItems: ReplacementItemDto[];
}

// =========================================================
// CREATE RETURN / EXCHANGE
// =========================================================

export class CreateReturnExchangeDto {
  // -------------------------------------------------------
  // Original invoice
  // -------------------------------------------------------

  @IsNotEmpty()
  @IsString()
  originalInvoiceNumber: string;

  // -------------------------------------------------------
  // Complete returns
  // -------------------------------------------------------

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  @IsOptional()
  returnedItems?: ReturnItemDto[];

  // -------------------------------------------------------
  // Exchanges
  // -------------------------------------------------------

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExchangeItemDto)
  @IsOptional()
  exchangeItems?: ExchangeItemDto[];

  // -------------------------------------------------------
  // Payment method
  // -------------------------------------------------------
  // Bank has intentionally been removed.
  // Only cash and card are supported.
  // -------------------------------------------------------

  @IsNotEmpty()
  @IsEnum(['cash', 'card'])
  paymentMethod: string;

  // -------------------------------------------------------
  // Optional note
  // -------------------------------------------------------

  @IsOptional()
  @IsString()
  note?: string;
}

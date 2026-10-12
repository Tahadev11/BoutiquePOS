import {
  IsArray,
  IsDateString,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class ReturnItemDto {
  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  // Price at which the item is being returned to the supplier.
  // Usually the same as the original purchase price, but the
  // user can override it (e.g. negotiated return credit).
  @IsNumber()
  @Min(0)
  returnPrice: number;
}

export class CreateReturnDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;
}
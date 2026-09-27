import {
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CheckoutItemDto {

  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CheckoutDto {

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @IsNotEmpty()
  @IsEnum(['cash', 'card'])
  paymentMethod: string;
}
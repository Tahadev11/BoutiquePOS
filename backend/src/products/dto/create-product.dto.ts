import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateProductDto {

  @IsString()
  @IsNotEmpty()
  dressName: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  size: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsNumber()
  @Min(0)
  actualPrice: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discount: number;

  @IsInt()
  @Min(0)
  stockQuantity: number;
}
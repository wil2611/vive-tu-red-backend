import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateNetworkNodeDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  strength?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

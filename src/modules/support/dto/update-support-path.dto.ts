import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class UpdateSupportPathDto {
  @IsString()
  @IsOptional()
  institutionName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsBoolean()
  @IsOptional()
  isEmergency?: boolean;

  @IsString()
  @IsOptional()
  attentionProcess?: string;

  @IsString()
  @IsOptional()
  schedule?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;
}

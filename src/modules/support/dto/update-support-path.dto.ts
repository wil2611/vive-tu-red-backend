import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class UpdateSupportPathDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  institutionName?: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalString)
  description?: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalString)
  phone?: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalString)
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalString)
  ubicacion?: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalString)
  schedule?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

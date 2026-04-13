import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class CreateSupportPathDto {
  @IsString()
  @IsNotEmpty()
  institutionName: string;

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

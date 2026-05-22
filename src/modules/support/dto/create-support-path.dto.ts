import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  SUPPORT_DESCRIPTION_MAX_LENGTH,
  SUPPORT_EMAIL_MAX_LENGTH,
  SUPPORT_INSTITUTION_NAME_MAX_LENGTH,
  SUPPORT_LOCATION_MAX_LENGTH,
  SUPPORT_PHONE_MAX_LENGTH,
  SUPPORT_SCHEDULE_MAX_LENGTH,
} from '../support.constants';

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeRequiredString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

export class CreateSupportPathDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(SUPPORT_INSTITUTION_NAME_MAX_LENGTH)
  @Transform(normalizeRequiredString)
  institutionName: string;

  @IsString()
  @IsOptional()
  @MaxLength(SUPPORT_DESCRIPTION_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(SUPPORT_PHONE_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  phone?: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalString)
  @IsEmail()
  @MaxLength(SUPPORT_EMAIL_MAX_LENGTH)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(SUPPORT_LOCATION_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  ubicacion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(SUPPORT_SCHEDULE_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  schedule?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

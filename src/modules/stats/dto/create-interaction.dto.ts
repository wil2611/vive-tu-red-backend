import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum InteractionType {
  BOOK_READ = 'book_read',
  RESOURCE_OPEN = 'resource_open',
  RESOURCE_DOWNLOAD = 'resource_download',
  NETWORK_CREATED = 'network_created',
  CONTACT_SUBMITTED = 'contact_submitted',
}

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class CreateInteractionDto {
  @IsEnum(InteractionType)
  @IsNotEmpty()
  type: InteractionType;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  @Transform(normalizeOptionalString)
  targetId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  @Transform(normalizeOptionalString)
  targetType?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  @Transform(normalizeOptionalString)
  sessionId?: string;
}

import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum InteractionType {
  BOOK_READ = 'book_read',
  RESOURCE_DOWNLOAD = 'resource_download',
  NETWORK_CREATED = 'network_created',
  CONTACT_SUBMITTED = 'contact_submitted',
}

export class CreateInteractionDto {
  @IsEnum(InteractionType)
  @IsNotEmpty()
  type: InteractionType;

  @IsString()
  @IsOptional()
  targetId?: string;

  @IsString()
  @IsOptional()
  targetType?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  sessionId?: string;
}

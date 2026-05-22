import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  STORY_DESCRIPTION_MAX_LENGTH,
  STORY_TITLE_MAX_LENGTH,
  STORY_URL_MAX_LENGTH,
} from '../stories.constants';

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class UpdateStoryDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(STORY_TITLE_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(STORY_DESCRIPTION_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(STORY_URL_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  @IsUrl({
    require_protocol: true,
    protocols: ['http', 'https'],
    require_tld: false,
  })
  coverImageUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(STORY_URL_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  @IsUrl({
    require_protocol: true,
    protocols: ['http', 'https'],
    require_tld: false,
  })
  pdfUrl?: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;
}

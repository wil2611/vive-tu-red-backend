import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  NEWS_AUTHOR_NAME_MAX_LENGTH,
  NEWS_BODY_MAX_LENGTH,
  NEWS_COVER_IMAGE_ALT_MAX_LENGTH,
  NEWS_COVER_IMAGE_URL_MAX_LENGTH,
  NEWS_EXCERPT_MAX_LENGTH,
  NEWS_TITLE_MAX_LENGTH,
} from '../news.constants';

const normalizeRequiredString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class CreateNewsDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(NEWS_TITLE_MAX_LENGTH)
  @Transform(normalizeRequiredString)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(NEWS_EXCERPT_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  excerpt?: string | null;

  @IsString()
  @IsNotEmpty()
  @MinLength(30)
  @MaxLength(NEWS_BODY_MAX_LENGTH)
  @Transform(normalizeRequiredString)
  body: string;

  @IsString()
  @IsOptional()
  @MaxLength(NEWS_COVER_IMAGE_URL_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  @IsUrl(
    {
      require_protocol: true,
      protocols: ['http', 'https'],
      require_tld: false,
    },
    { message: 'coverImageUrl debe ser una URL valida con http o https.' },
  )
  coverImageUrl?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(NEWS_COVER_IMAGE_ALT_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  coverImageAlt?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(NEWS_AUTHOR_NAME_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  authorName?: string | null;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'publishedAt debe ser una fecha valida en formato ISO.' })
  @Transform(normalizeOptionalString)
  publishedAt?: string | null;
}

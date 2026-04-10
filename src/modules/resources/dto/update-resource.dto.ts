import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsIn,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  normalizeResourceCategory,
  RESOURCE_CATEGORIES,
} from '../resource-categories';
import {
  RESOURCE_DESCRIPTION_MAX_LENGTH,
  RESOURCE_FILE_URL_MAX_LENGTH,
  RESOURCE_TAG_MAX_LENGTH,
  RESOURCE_TAGS_MAX_COUNT,
  RESOURCE_TITLE_MAX_LENGTH,
  RESOURCE_TYPE_MAX_LENGTH,
} from '../resources.constants';

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeOptionalRequiredString = ({
  value,
}: {
  value: unknown;
}): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

const normalizeCategory = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null || value === '') return undefined;
  const category = normalizeResourceCategory(value);
  return category ?? value;
};

const normalizeTags = ({ value }: { value: unknown }): unknown => {
  if (!Array.isArray(value)) return value;

  const unique = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const tag = item.trim();
    if (!tag) continue;
    unique.add(tag);
  }

  return Array.from(unique);
};

export class UpdateResourceDto {
  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalRequiredString)
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(RESOURCE_TITLE_MAX_LENGTH)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(RESOURCE_DESCRIPTION_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  description?: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalRequiredString)
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(RESOURCE_TYPE_MAX_LENGTH)
  type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(RESOURCE_FILE_URL_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  @IsUrl(
    {
      require_protocol: true,
      protocols: ['http', 'https'],
      require_tld: false,
    },
    { message: 'fileUrl debe ser una URL valida con http o https.' },
  )
  fileUrl?: string;

  @IsString()
  @IsOptional()
  @IsIn(RESOURCE_CATEGORIES)
  @Transform(normalizeCategory)
  category?: (typeof RESOURCE_CATEGORIES)[number];

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(RESOURCE_TAGS_MAX_COUNT)
  @IsString({ each: true })
  @MaxLength(RESOURCE_TAG_MAX_LENGTH, { each: true })
  @Transform(normalizeTags)
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

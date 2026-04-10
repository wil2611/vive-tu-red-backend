import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsIn,
  IsUrl,
} from 'class-validator';
import {
  normalizeResourceCategory,
  RESOURCE_CATEGORIES,
} from '../resource-categories';

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
  @Transform(normalizeOptionalString)
  title?: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalString)
  description?: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalString)
  type?: string;

  @IsString()
  @IsOptional()
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
  @Transform(normalizeTags)
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

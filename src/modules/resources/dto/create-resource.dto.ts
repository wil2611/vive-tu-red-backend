import {
  IsIn,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  normalizeResourceCategory,
  RESOURCE_CATEGORIES,
} from '../resource-categories';

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeRequiredString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

const normalizeCategory = ({ value }: { value: unknown }): unknown => {
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

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  @Transform(normalizeRequiredString)
  title: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalString)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(normalizeRequiredString)
  type: string; // 'pdf' | 'infografia' | 'guia' | 'cartilla'

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
  @IsNotEmpty()
  @IsIn(RESOURCE_CATEGORIES)
  @Transform(normalizeCategory)
  category: (typeof RESOURCE_CATEGORIES)[number];

  @IsArray()
  @IsOptional()
  @Transform(normalizeTags)
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

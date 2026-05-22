import {
  IsIn,
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export const PUBLIC_TRACKABLE_PATHS = [
  '/',
  '/sobre',
  '/equipo',
  '/recursos',
  '/redes',
  '/contacto',
  '/libro',
] as const;

const normalizePath = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  try {
    const parsedUrl = new URL(trimmed, 'https://vivetured.local');
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, '') || '/';
    return normalizedPath;
  } catch {
    return trimmed.split('?')[0]?.split('#')[0]?.replace(/\/+$/, '') || trimmed;
  }
};

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class CreatePageViewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @IsIn(PUBLIC_TRACKABLE_PATHS)
  @Transform(normalizePath)
  path: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  @Transform(normalizeOptionalString)
  referrer?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  @Transform(normalizeOptionalString)
  sessionId?: string;
}

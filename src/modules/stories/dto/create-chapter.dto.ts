import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  STORY_CHAPTER_CONTENT_MAX_LENGTH,
  STORY_CHAPTER_SUMMARY_MAX_LENGTH,
  STORY_CHAPTER_TITLE_MAX_LENGTH,
} from '../stories.constants';

const normalizeRequiredString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class CreateChapterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(STORY_CHAPTER_TITLE_MAX_LENGTH)
  @Transform(normalizeRequiredString)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(STORY_CHAPTER_CONTENT_MAX_LENGTH)
  @Transform(normalizeRequiredString)
  content: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(STORY_CHAPTER_SUMMARY_MAX_LENGTH)
  @Transform(normalizeOptionalString)
  summary?: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  storyId: string;
}

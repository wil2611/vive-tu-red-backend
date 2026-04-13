import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ALLY_INSTITUTION_NAME_MAX_LENGTH,
  ALLY_PARTICIPATION_SCOPE_MAX_LENGTH,
  ALLY_ROLE_LABEL_MAX_LENGTH,
  ALLY_SUMMARY_MAX_LENGTH,
} from '../allies.constants';
import { ProjectAllyType } from '../allies.types';

const normalizeRequiredString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

export class CreateProjectAllyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(ALLY_INSTITUTION_NAME_MAX_LENGTH)
  @Transform(normalizeRequiredString)
  institutionName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(ALLY_ROLE_LABEL_MAX_LENGTH)
  @Transform(normalizeRequiredString)
  roleLabel: string;

  @IsEnum(ProjectAllyType)
  type: ProjectAllyType;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(ALLY_SUMMARY_MAX_LENGTH)
  @Transform(normalizeRequiredString)
  summary: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(ALLY_PARTICIPATION_SCOPE_MAX_LENGTH)
  @Transform(normalizeRequiredString)
  participationScope: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

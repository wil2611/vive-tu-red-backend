import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  TEAM_DEPARTMENT_MAX_LENGTH,
  TEAM_DIVISION_MAX_LENGTH,
  TEAM_NAME_MAX_LENGTH,
  TEAM_PHOTO_MAX_LENGTH,
  TEAM_PROFILE_MAX_LENGTH,
} from '../team.constants';

const normalizeRequiredString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class CreateTeamMemberDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(TEAM_NAME_MAX_LENGTH)
  @Transform(normalizeRequiredString)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(TEAM_PROFILE_MAX_LENGTH)
  @Transform(normalizeRequiredString)
  profile: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalString)
  @MaxLength(TEAM_DEPARTMENT_MAX_LENGTH)
  department?: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalString)
  @MaxLength(TEAM_DIVISION_MAX_LENGTH)
  division?: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalString)
  @MaxLength(TEAM_PHOTO_MAX_LENGTH)
  @IsUrl(
    {
      require_protocol: true,
      protocols: ['http', 'https'],
      require_tld: false,
    },
    { message: 'photo debe ser una URL valida con http o https.' },
  )
  photo?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

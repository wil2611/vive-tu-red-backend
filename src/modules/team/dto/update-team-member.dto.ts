import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsNotEmpty,
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

const normalizeOptionalRequiredString = ({
  value,
}: {
  value: unknown;
}): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

const normalizeOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class UpdateTeamMemberDto {
  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalRequiredString)
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(TEAM_NAME_MAX_LENGTH)
  name?: string;

  @IsString()
  @IsOptional()
  @Transform(normalizeOptionalRequiredString)
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(TEAM_PROFILE_MAX_LENGTH)
  profile?: string;

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

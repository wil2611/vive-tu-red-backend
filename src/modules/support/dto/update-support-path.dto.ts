import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSupportPathDto {
  @IsString()
  @IsOptional()
  institutionName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  ubicacion?: string;

  @IsString()
  @IsOptional()
  schedule?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

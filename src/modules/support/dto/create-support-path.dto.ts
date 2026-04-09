import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateSupportPathDto {
  @IsString()
  @IsNotEmpty()
  institutionName: string;

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

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePageViewDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  @IsOptional()
  referrer?: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}

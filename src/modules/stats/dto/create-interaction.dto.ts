import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateInteractionDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  targetId?: string;

  @IsString()
  @IsOptional()
  targetType?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  sessionId?: string;
}

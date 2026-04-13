import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangeMyPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  newPassword: string;
}

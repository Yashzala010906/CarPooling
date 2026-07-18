import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import type { RegisterRequest } from '@carpool/types';

export class RegisterDto implements RegisterRequest {
  @IsString()
  @IsNotEmpty()
  companyCode!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

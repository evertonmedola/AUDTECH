import {
  IsString, IsEmail, IsOptional, MinLength,
  MaxLength, Matches, ValidateNested, IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminDto {
  @IsString()
  @MinLength(4)
  @MaxLength(150)
  @Matches(/^[a-zA-ZÀ-ÿ\s]+$/)
  nome: string;

  @IsString()
  cpf: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  senha: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cargo?: string;
}

export class CriarEmpresaComAdminDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  razaoSocial: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nomeFantasia?: string;

  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  segmento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tipoEmpresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;


  @ValidateNested()
  @Type(() => AdminDto)
  admin: AdminDto;
}
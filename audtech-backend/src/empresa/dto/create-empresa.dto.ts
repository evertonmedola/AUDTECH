import {
  IsString,
  IsOptional,
  MaxLength,
  IsEnum,
  Matches,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { validarCnpj } from '../../common/pipes/cnpj-validation.pipe';

@ValidatorConstraint({ name: 'isCnpj', async: false })
export class IsCnpjConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return validarCnpj(value);
  }
  defaultMessage() {
    return 'CNPJ inválido.';
  }
}

export class CreateEmpresaDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  razaoSocial: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nomeFantasia?: string;

  @IsString()
  @MaxLength(100)
  tipoEmpresa: string;

  @IsString()
  @Validate(IsCnpjConstraint)
  cnpj: string;

  @IsOptional()
  @IsString()
  @Matches(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, {
    message: 'Telefone inválido. Use o formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.',
  })
  telefone?: string;
}

export class UpdateEmpresaDto extends PartialType(CreateEmpresaDto) {
  @IsOptional()
  @IsEnum(['ATIVO', 'INATIVO'])
  status?: string;
}

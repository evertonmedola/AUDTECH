import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsInt,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { PerfilUsuario } from '../../common/enums/perfil-usuario.enum';
import { validarCpf } from '../../common/pipes/cpf-validation.pipe';

@ValidatorConstraint({ name: 'isCpf', async: false })
export class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return validarCpf(value);
  }
  defaultMessage() {
    return 'CPF inválido.';
  }
}

export class CreateUsuarioDto {
  @IsEnum(PerfilUsuario, {
    message: 'Perfil deve ser AUDITOR, RAC ou ADMIN.',
  })
  perfil: PerfilUsuario;

  @IsString()
  @MinLength(4, { message: 'Nome deve ter no mínimo 4 caracteres.' })
  @MaxLength(150)
  @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, {
    message: 'Nome deve conter apenas letras e espaços.',
  })
  nome: string;

  @IsString()
  @Validate(IsCpfConstraint)
  cpf: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(200)
  email: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Senha deve conter letra maiúscula, minúscula e número.',
  })
  senha: string;

  @IsOptional()
  @IsString()
  @Matches(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, {
    message: 'Telefone inválido. Use o formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.',
  })
  telefone?: string;

  // Obrigatório para ADMIN — validação de negócio feita no service
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cargo?: string;

  // Obrigatório para RAC — validação de negócio feita no service
  @IsOptional()
  @IsString()
  @MaxLength(100)
  departamento?: string;

  @IsInt()
  empresaId: number;
}

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @IsOptional()
  @IsEnum(['ATIVO', 'INATIVO'])
  status?: string;
}

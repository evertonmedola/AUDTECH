import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { TipoNorma } from '../../common/enums/tipo-norma.enum';

export class CreateItemTemplateDto {
  @IsString()
  @MaxLength(150)
  grupo: string;

  @IsString()
  @MinLength(5)
  descricao: string;

  @IsInt()
  @Min(0)
  ordem: number;
}

export class CreateChecklistTemplateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  titulo: string;

  @IsEnum(TipoNorma, {
    message: `Tipo de norma inválido. Valores aceitos: ${Object.values(TipoNorma).join(', ')}`,
  })
  tipoNorma: TipoNorma;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemTemplateDto)
  itens: CreateItemTemplateDto[];
}

export class UpdateChecklistTemplateDto extends PartialType(CreateChecklistTemplateDto) {
  @IsOptional()
  @IsEnum(['ATIVO', 'INATIVO'])
  status?: string;
}

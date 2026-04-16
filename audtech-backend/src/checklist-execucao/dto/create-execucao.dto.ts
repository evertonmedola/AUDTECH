import {
  IsInt,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResultadoItem, CategoriaPendencia } from '../../common/enums/resultado-item.enum';
import { Criticidade, CriticidadeAmbiental } from '../../common/enums/criticidade.enum';

// --- Criação da execução ---
export class CreateExecucaoDto {
  @IsInt()
  templateId: number;

  @IsInt()
  auditorId: number;

  @IsOptional()
  @IsDateString()
  prazo?: string;
}

// --- Atualização de um item da execução ---
export class UpdateItemExecucaoDto {
  @IsEnum(ResultadoItem, {
    message: `Resultado deve ser: ${Object.values(ResultadoItem).join(', ')}`,
  })
  resultado: ResultadoItem;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Observação não pode ultrapassar 1000 caracteres.' })
  observacao?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Prazo inválido. Use o formato YYYY-MM-DD.' })
  prazo?: string;
}

// --- Registro de pendência ---
export class CreatePendenciaDto {
  @IsEnum(CategoriaPendencia, {
    message: `Categoria deve ser: ${Object.values(CategoriaPendencia).join(', ')}`,
  })
  categoria: CategoriaPendencia;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsOptional()
  @IsString()
  referenciaNormativa?: string;

  // Obrigatória se categoria = AMBIENTAL
  @IsOptional()
  @IsEnum(CriticidadeAmbiental)
  criticidade?: CriticidadeAmbiental;
}

// --- Registro de não conformidade ---
export class CreateNaoConformidadeDto {
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  normaReferencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  localProcesso?: string;

  @IsEnum(Criticidade, {
    message: `Criticidade deve ser: ${Object.values(Criticidade).join(', ')}`,
  })
  criticidade: Criticidade;
}

// --- Assinatura do checklist ---
export class AssinarChecklistDto {
  @IsEnum(['DESENHO', 'CREDENCIAL'])
  tipoAssinatura: 'DESENHO' | 'CREDENCIAL';

  // Para DESENHO: base64 da imagem; para CREDENCIAL: confirmação via token já autenticado
  @IsOptional()
  @IsString()
  assinatura?: string;

  // Para CREDENCIAL: senha re-confirmada
  @IsOptional()
  @IsString()
  senha?: string;
}

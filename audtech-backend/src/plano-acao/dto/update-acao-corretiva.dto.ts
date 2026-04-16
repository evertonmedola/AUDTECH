import {
  IsInt,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { StatusAcao } from '../../common/enums/status.enum';

export class UpdateAcaoCorretivaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  descricao?: string;

  @IsOptional()
  @IsInt()
  responsavelId?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Prazo inválido. Use o formato YYYY-MM-DD.' })
  prazo?: string;

  @IsOptional()
  @IsEnum(StatusAcao, {
    message: `Status deve ser: ${Object.values(StatusAcao).join(', ')}`,
  })
  status?: StatusAcao;

  // Obrigatória quando status = CANCELADO
  @IsOptional()
  @IsString()
  justificativaCancelamento?: string;
}

export class CreateEvidenciaAcaoDto {
  @IsInt()
  acaoCorretivaId: number;
}

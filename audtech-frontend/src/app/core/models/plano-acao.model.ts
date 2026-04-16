import { StatusAcao, TipoArquivo } from './enums';

export interface EvidenciaAcao {
  id: number;
  arquivoUrl: string;
  tipoArquivo: TipoArquivo;
  nomeOriginal: string;
  acaoCorretivaId: number;
  criadoEm: string;
}

export interface AcaoCorretiva {
  id: number;
  descricao: string;
  prazo: string;
  status: StatusAcao;
  justificativaCancelamento?: string;
  planoAcaoId: number;
  naoConformidadeId: number;
  responsavelId: number;
  responsavel?: { id: number; nome: string; email: string };
  naoConformidade?: {
    id: number;
    descricao: string;
    criticidade: string;
  };
  evidencias: EvidenciaAcao[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface PlanoAcao {
  id: number;
  status: StatusAcao;
  checklistExecucaoId: number;
  checklistExecucao?: {
    id: number;
    status: string;
    template?: { titulo: string };
  };
  acoesCorretivas: AcaoCorretiva[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface UpdateAcaoCorretivaDto {
  descricao?: string;
  responsavelId?: number;
  prazo?: string;
  status?: StatusAcao;
  justificativaCancelamento?: string;
}

// Resumo para listagem
export interface PlanoResumo {
  id: number;
  status: StatusAcao;
  checklistExecucaoId: number;
  totalAcoes: number;
  acoesConcluidas: number;
  acoesEmAtraso: number;
}

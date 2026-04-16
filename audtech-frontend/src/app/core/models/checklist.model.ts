import {
  TipoNorma, Status, StatusChecklist,
  ResultadoItem, CategoriaPendencia,
  CriticidadeAmbiental, Criticidade,
  StatusNaoConformidade, TipoArquivo,
} from './enums';

// ── Templates ─────────────────────────────────────────────────────────────────

export interface ItemTemplate {
  id: number;
  grupo: string;
  descricao: string;
  ordem: number;
  checklistTemplateId: number;
}

export interface ChecklistTemplate {
  id: number;
  titulo: string;
  tipoNorma: TipoNorma;
  descricao?: string;
  status: Status;
  empresaId: number | null;
  global: boolean;
  itens: ItemTemplate[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateChecklistTemplateDto {
  titulo: string;
  tipoNorma: TipoNorma;
  descricao?: string;
  itens: { grupo: string; descricao: string; ordem: number }[];
}

// ── Execução ──────────────────────────────────────────────────────────────────

export interface Evidencia {
  id: number;
  arquivoUrl: string;
  tipoArquivo: TipoArquivo;
  nomeOriginal: string;
  itemExecucaoId: number;
  criadoEm: string;
}

export interface Pendencia {
  id: number;
  categoria: CategoriaPendencia;
  descricao: string;
  referenciaNormativa?: string;
  criticidade?: CriticidadeAmbiental;
  anexoUrl?: string;
  itemExecucaoId: number;
}

export interface NaoConformidade {
  id: number;
  descricao: string;
  normaReferencia?: string;
  localProcesso?: string;
  criticidade: Criticidade;
  status: StatusNaoConformidade;
  itemExecucaoId: number;
}

export interface ItemExecucao {
  id: number;
  resultado?: ResultadoItem;
  observacao?: string;
  prazo?: string;
  checklistExecucaoId: number;
  itemTemplateId: number;
  itemTemplate: ItemTemplate;
  evidencias: Evidencia[];
  pendencias: Pendencia[];
  naoConformidades: NaoConformidade[];
}

export interface ChecklistExecucao {
  id: number;
  status: StatusChecklist;
  dataInicio?: string;
  dataConclusao?: string;
  prazo?: string;
  assinatura?: string;
  tipoAssinatura?: 'DESENHO' | 'CREDENCIAL';
  assinadoEm?: string;
  empresaId: number;
  auditorId: number;
  templateId: number;
  auditor?: { id: number; nome: string; email: string };
  template?: { id: number; titulo: string; tipoNorma: TipoNorma };
  itens: ItemExecucao[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateExecucaoDto {
  templateId: number;
  auditorId: number;
  prazo?: string;
}

export interface UpdateItemExecucaoDto {
  resultado: ResultadoItem;
  observacao?: string;
  prazo?: string;
}

export interface CreatePendenciaDto {
  categoria: CategoriaPendencia;
  descricao: string;
  referenciaNormativa?: string;
  criticidade?: CriticidadeAmbiental;
}

export interface CreateNaoConformidadeDto {
  descricao: string;
  normaReferencia?: string;
  localProcesso?: string;
  criticidade: Criticidade;
}

export interface AssinarChecklistDto {
  tipoAssinatura: 'DESENHO' | 'CREDENCIAL';
  assinatura?: string;
  senha?: string;
}

// Grupos de itens para exibição agrupada no template
export interface GrupoItens {
  grupo: string;
  itens: ItemExecucao[];
}

export enum PerfilUsuario {
  AUDITOR = 'AUDITOR',
  RAC = 'RAC',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN'
}

export enum Status {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

export enum StatusChecklist {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  EM_ATRASO = 'EM_ATRASO',
}

export enum StatusAcao {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  EM_ATRASO = 'EM_ATRASO',
  CANCELADO = 'CANCELADO',
}

export enum StatusNaoConformidade {
  ABERTA = 'ABERTA',
  ENCERRADA = 'ENCERRADA',
}

export enum TipoNorma {
  ANVISA = 'ANVISA',
  ISO_9001 = 'ISO_9001',
  ISO_22000 = 'ISO_22000',
  MAPA = 'MAPA',
  VIGILANCIA_SANITARIA = 'VIGILANCIA_SANITARIA',
  ISO_45001 = 'ISO_45001',
  ISO_14001 = 'ISO_14001',
}

export enum Criticidade {
  CRITICA = 'CRITICA',
  MAIOR = 'MAIOR',
  MENOR = 'MENOR',
}

export enum CriticidadeAmbiental {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export enum ResultadoItem {
  CONFORME = 'CONFORME',
  NAO_CONFORME = 'NAO_CONFORME',
  NAO_APLICAVEL = 'NAO_APLICAVEL',
}

export enum CategoriaPendencia {
  DOCUMENTAL = 'DOCUMENTAL',
  ESTRUTURAL = 'ESTRUTURAL',
  AMBIENTAL = 'AMBIENTAL',
}

export enum TipoArquivo {
  JPG = 'JPG',
  PNG = 'PNG',
  PDF = 'PDF',
}

// Labels para exibição em UI
export const PERFIL_LABELS: Record<PerfilUsuario, string> = {
  [PerfilUsuario.AUDITOR]: 'Auditor',
  [PerfilUsuario.RAC]: 'Responsável por Ações Corretivas',
  [PerfilUsuario.ADMIN]: 'Administrador',
  [PerfilUsuario.SUPERADMIN]: 'Super Administrador',
};

export const STATUS_CHECKLIST_LABELS: Record<StatusChecklist, string> = {
  [StatusChecklist.PENDENTE]: 'Pendente',
  [StatusChecklist.EM_ANDAMENTO]: 'Em Andamento',
  [StatusChecklist.CONCLUIDO]: 'Concluído',
  [StatusChecklist.EM_ATRASO]: 'Em Atraso',
};

export const STATUS_ACAO_LABELS: Record<StatusAcao, string> = {
  [StatusAcao.PENDENTE]: 'Pendente',
  [StatusAcao.EM_ANDAMENTO]: 'Em Andamento',
  [StatusAcao.CONCLUIDO]: 'Concluído',
  [StatusAcao.EM_ATRASO]: 'Em Atraso',
  [StatusAcao.CANCELADO]: 'Cancelado',
};

export const TIPO_NORMA_LABELS: Record<TipoNorma, string> = {
  [TipoNorma.ANVISA]: 'ANVISA',
  [TipoNorma.ISO_9001]: 'ISO 9001 — Qualidade',
  [TipoNorma.ISO_22000]: 'ISO 22000 — Segurança Alimentar',
  [TipoNorma.MAPA]: 'MAPA',
  [TipoNorma.VIGILANCIA_SANITARIA]: 'Vigilância Sanitária',
  [TipoNorma.ISO_45001]: 'ISO 45001 — Segurança Trabalhista',
  [TipoNorma.ISO_14001]: 'ISO 14001 — Ambiental',
};

export const CRITICIDADE_LABELS: Record<Criticidade, string> = {
  [Criticidade.CRITICA]: 'Crítica',
  [Criticidade.MAIOR]: 'Maior',
  [Criticidade.MENOR]: 'Menor',
};

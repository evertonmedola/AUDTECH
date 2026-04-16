import { Pipe, PipeTransform } from '@angular/core';
import {
  STATUS_CHECKLIST_LABELS,
  STATUS_ACAO_LABELS,
  PERFIL_LABELS,
  TIPO_NORMA_LABELS,
  CRITICIDADE_LABELS,
  StatusChecklist,
  StatusAcao,
  PerfilUsuario,
  TipoNorma,
  Criticidade,
} from '../../core/models/enums';

type EnumValue =
  | StatusChecklist
  | StatusAcao
  | PerfilUsuario
  | TipoNorma
  | Criticidade
  | string;

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(value: EnumValue | null | undefined): string {
    if (!value) return '—';

    return (
      STATUS_CHECKLIST_LABELS[value as StatusChecklist] ??
      STATUS_ACAO_LABELS[value as StatusAcao] ??
      PERFIL_LABELS[value as PerfilUsuario] ??
      TIPO_NORMA_LABELS[value as TipoNorma] ??
      CRITICIDADE_LABELS[value as Criticidade] ??
      value
    );
  }
}

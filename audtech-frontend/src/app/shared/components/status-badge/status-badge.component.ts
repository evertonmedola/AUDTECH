import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusLabelPipe } from '../../pipes/status-label.pipe';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, StatusLabelPipe],
  template: `
    <span class="badge" [ngClass]="cssClass()">
      {{ valor() | statusLabel }}
    </span>
  `,
})
export class StatusBadgeComponent {
  valor = input.required<string>();

  cssClass() {
    const map: Record<string, string> = {
      PENDENTE:     'badge-pendente',
      EM_ANDAMENTO: 'badge-andamento',
      CONCLUIDO:    'badge-concluido',
      EM_ATRASO:    'badge-atraso',
      CANCELADO:    'badge-cancelado',
      ATIVO:        'badge-ativo',
      INATIVO:      'badge-inativo',
      CRITICA:      'badge-critica',
      MAIOR:        'badge-maior',
      MENOR:        'badge-menor',
      ABERTA:       'badge-atraso',
      ENCERRADA:    'badge-concluido',
    };
    return map[this.valor()] ?? '';
  }
}

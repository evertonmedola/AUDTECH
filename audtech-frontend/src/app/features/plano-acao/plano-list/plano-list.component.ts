import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PlanoAcaoService } from '../../../core/services/plano-acao.service';
import { PlanoAcao } from '../../../core/models/plano-acao.model';
import { StatusAcao } from '../../../core/models/enums';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-plano-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, MatButtonModule,
    MatIconModule, MatProgressBarModule,
    StatusBadgeComponent, PageHeaderComponent, EmptyStateComponent,
  ],
  template: `
    <app-page-header titulo="Planos de Ação" subtitulo="Acompanhe as ações corretivas das auditorias" />

    @if (carregando()) {
      <div class="space-y-2">
        @for (_ of [1,2,3]; track $index) {
          <div class="h-14 bg-gray-100 rounded animate-pulse"></div>
        }
      </div>
    } @else if (planos().length === 0) {
      <app-empty-state
        icone="assignment_turned_in"
        titulo="Nenhum plano de ação"
        descricao="Os planos são gerados automaticamente ao concluir uma auditoria com não conformidades."
      />
    } @else {
      <div class="mat-elevation-z1 rounded-xl overflow-hidden">
        <table mat-table [dataSource]="planos()">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let p">{{ p.id }}</td>
          </ng-container>

          <ng-container matColumnDef="auditoria">
            <th mat-header-cell *matHeaderCellDef>Auditoria</th>
            <td mat-cell *matCellDef="let p">
              <p class="font-medium text-gray-800">
                Auditoria #{{ p.checklistExecucaoId }}
              </p>
              @if (p.checklistExecucao?.template?.titulo) {
                <p class="text-xs text-gray-400">{{ p.checklistExecucao.template.titulo }}</p>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="progresso">
            <th mat-header-cell *matHeaderCellDef>Progresso</th>
            <td mat-cell *matCellDef="let p">
              <div class="flex items-center gap-2">
                <mat-progress-bar
                  mode="determinate"
                  [value]="calcularProgresso(p)"
                  class="w-24"
                />
                <span class="text-xs text-gray-500">{{ calcularProgresso(p) }}%</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let p"><app-status-badge [valor]="p.status" /></td>
          </ng-container>

          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <a mat-icon-button [routerLink]="['execucao', p.checklistExecucaoId]">
                <mat-icon>open_in_new</mat-icon>
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;" class="cursor-pointer"
            [routerLink]="['execucao', row.checklistExecucaoId]"></tr>
        </table>
      </div>
    }
  `,
})
export class PlanoListComponent implements OnInit {
  private readonly planoService = inject(PlanoAcaoService);
  readonly colunas    = ['id', 'auditoria', 'progresso', 'status', 'acoes'];
  readonly carregando = signal(true);
  readonly planos     = signal<PlanoAcao[]>([]);

  ngOnInit(): void {
    this.planoService.listar().subscribe({
      next: (lista) => { this.planos.set(lista); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }

  calcularProgresso(plano: PlanoAcao): number {
    const total = plano.acoesCorretivas?.length ?? 0;
    if (total === 0) return 0;
    const concluidas = plano.acoesCorretivas.filter(
      a => a.status === StatusAcao.CONCLUIDO || a.status === StatusAcao.CANCELADO,
    ).length;
    return Math.round((concluidas / total) * 100);
  }
}

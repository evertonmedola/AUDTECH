import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ChecklistExecucaoService } from '../../../core/services/checklist-execucao.service';
import { AuthStore } from '../../../store/auth.store';
import { ChecklistExecucao } from '../../../core/models/checklist.model';
import { PerfilUsuario, StatusChecklist } from '../../../core/models/enums';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-execucao-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule,
    StatusBadgeComponent, PageHeaderComponent, EmptyStateComponent, StatusLabelPipe,
  ],
  template: `
    <app-page-header titulo="Auditorias" subtitulo="Checklists de auditoria interna">
      @if (isAdmin()) {
        <a mat-flat-button color="primary" routerLink="nova">
          <mat-icon>add</mat-icon> Nova auditoria
        </a>
      }
    </app-page-header>

    <mat-form-field appearance="outline" class="w-52 mb-4">
      <mat-label>Filtrar por status</mat-label>
      <mat-select [(ngModel)]="filtroStatus">
        <mat-option value="">Todos</mat-option>
        @for (s of statusOpcoes; track s) {
          <mat-option [value]="s">{{ s | statusLabel }}</mat-option>
        }
      </mat-select>
    </mat-form-field>

    @if (carregando()) {
      <div class="space-y-2">
        @for (_ of [1,2,3]; track $index) {
          <div class="h-14 bg-gray-100 rounded animate-pulse"></div>
        }
      </div>
    } @else if (execucoesFiltradas().length === 0) {
      <app-empty-state icone="fact_check" titulo="Nenhuma auditoria encontrada" />
    } @else {
      <div class="mat-elevation-z1 rounded-xl overflow-hidden">
        <table mat-table [dataSource]="execucoesFiltradas()">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let e">{{ e.id }}</td>
          </ng-container>

          <ng-container matColumnDef="template">
            <th mat-header-cell *matHeaderCellDef>Template</th>
            <td mat-cell *matCellDef="let e">
              <p class="font-medium text-gray-800">{{ e.template?.titulo }}</p>
              <p class="text-xs text-gray-400">{{ e.template?.tipoNorma | statusLabel }}</p>
            </td>
          </ng-container>

          <ng-container matColumnDef="auditor">
            <th mat-header-cell *matHeaderCellDef>Auditor</th>
            <td mat-cell *matCellDef="let e">{{ e.auditor?.nome }}</td>
          </ng-container>

          <ng-container matColumnDef="prazo">
            <th mat-header-cell *matHeaderCellDef>Prazo</th>
            <td mat-cell *matCellDef="let e">
              {{ e.prazo ? (e.prazo | date:'dd/MM/yyyy') : '—' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let e"><app-status-badge [valor]="e.status" /></td>
          </ng-container>

          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let e">
              <a mat-icon-button [routerLink]="[e.id]">
                <mat-icon>open_in_new</mat-icon>
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;" [routerLink]="[row.id]" class="cursor-pointer"></tr>
        </table>
      </div>
    }
  `,
})
export class ExecucaoListComponent implements OnInit {
  private readonly execucaoService = inject(ChecklistExecucaoService);
  private readonly authStore       = inject(AuthStore);

  readonly colunas      = ['id', 'template', 'auditor', 'prazo', 'status', 'acoes'];
  readonly carregando   = signal(true);
  readonly execucoes    = signal<ChecklistExecucao[]>([]);
  readonly isAdmin      = this.authStore.isAdmin;
  filtroStatus          = '';
  readonly statusOpcoes = Object.values(StatusChecklist);

  readonly execucoesFiltradas = computed(() => {
    if (!this.filtroStatus) return this.execucoes();
    return this.execucoes().filter(e => e.status === this.filtroStatus);
  });

  ngOnInit(): void {
    this.execucaoService.listar().subscribe({
      next: (lista) => { this.execucoes.set(lista); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { ChecklistTemplateService } from '@core/services/checklist-template.service';
import { AppStore } from '@store/app.store';
import { ChecklistTemplate } from '@core/models/checklist.model';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { StatusLabelPipe } from '@shared/pipes/status-label.pipe';

@Component({
  selector: 'app-template-global-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, MatButtonModule,
    MatIconModule, MatMenuModule, StatusBadgeComponent,
    PageHeaderComponent, EmptyStateComponent, StatusLabelPipe,
  ],
  template: `
    <app-page-header
      titulo="Templates Padrão"
      subtitulo="Templates globais disponíveis para todas as empresas"
    >
      <a mat-flat-button color="primary" routerLink="novo">
        <mat-icon>add</mat-icon> Novo template padrão
      </a>
    </app-page-header>

    @if (carregando()) {
      <div class="space-y-2">
        @for (_ of [1,2,3]; track $index) {
          <div class="h-14 bg-gray-100 rounded animate-pulse"></div>
        }
      </div>
    } @else if (templates().length === 0) {
      <app-empty-state icone="library_books" titulo="Nenhum template padrão cadastrado" />
    } @else {
      <div class="mat-elevation-z1 rounded-xl overflow-hidden">
        <table mat-table [dataSource]="templates()">
          <ng-container matColumnDef="titulo">
            <th mat-header-cell *matHeaderCellDef>Título</th>
            <td mat-cell *matCellDef="let t">
              <p class="font-medium text-gray-800">{{ t.titulo }}</p>
              <p class="text-xs text-gray-400">{{ t.tipoNorma | statusLabel }}</p>
            </td>
          </ng-container>

          <ng-container matColumnDef="itens">
            <th mat-header-cell *matHeaderCellDef>Itens</th>
            <td mat-cell *matCellDef="let t">{{ t.itens?.length ?? 0 }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let t"><app-status-badge [valor]="t.status" /></td>
          </ng-container>

          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let t">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu>
                <a mat-menu-item [routerLink]="[t.id, 'editar']">
                  <mat-icon>edit</mat-icon> Editar
                </a>
                <button mat-menu-item (click)="inativar(t)" [disabled]="t.status === 'INATIVO'">
                  <mat-icon>block</mat-icon> Inativar
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
        </table>
      </div>
    }
  `,
})
export class TemplateGlobalListComponent implements OnInit {
  private readonly templateService = inject(ChecklistTemplateService);
  private readonly appStore = inject(AppStore);
  private readonly dialog = inject(MatDialog);

  readonly colunas = ['titulo', 'itens', 'status', 'acoes'];
  readonly carregando = signal(true);
  readonly templates = signal<ChecklistTemplate[]>([]);

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando.set(true);
    this.templateService.listarGlobais().subscribe({
      next: (lista) => { this.templates.set(lista); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }

  inativar(template: ChecklistTemplate): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { titulo: 'Inativar template', mensagem: `Inativar "${template.titulo}"?` },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.templateService.inativarGlobal(template.id).subscribe({
        next: () => { this.appStore.sucesso('Template inativado.'); this.carregar(); },
      });
    });
  }
}
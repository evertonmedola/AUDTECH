import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { EmpresaService } from '../../../core/services/empresa.service';
import { AppStore } from '../../../store/app.store';
import { Empresa } from '../../../core/models/usuario.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CnpjMaskPipe } from '../../../shared/pipes/cnpj-mask.pipe';

@Component({
  selector: 'app-empresa-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatMenuModule,
    StatusBadgeComponent, PageHeaderComponent,
    EmptyStateComponent, CnpjMaskPipe,
  ],
  template: `
    <app-page-header titulo="Empresas" subtitulo="Gerencie as organizações cadastradas">
      <a mat-flat-button color="primary" routerLink="novo">
        <mat-icon>add</mat-icon> Nova empresa
      </a>
    </app-page-header>

    <!-- Busca -->
    <mat-form-field appearance="outline" class="w-full max-w-sm mb-4">
      <mat-label>Buscar empresa</mat-label>
      <input matInput [ngModel]="busca()" (ngModelChange)="busca.set($event)" placeholder="Razão social ou CNPJ..." />
      <mat-icon matSuffix>search</mat-icon>
    </mat-form-field>

    @if (carregando()) {
      <div class="space-y-2">
        @for (_ of [1,2,3,4,5]; track $index) {
          <div class="h-12 bg-gray-100 rounded animate-pulse"></div>
        }
      </div>
    } @else if (empresasFiltradas().length === 0) {
      <app-empty-state
        icone="business"
        titulo="Nenhuma empresa encontrada"
        descricao="Cadastre a primeira empresa do sistema."
      >
        <a mat-flat-button color="primary" routerLink="novo" class="mt-4">
          Cadastrar empresa
        </a>
      </app-empty-state>
    } @else {
      <div class="mat-elevation-z1 rounded-xl overflow-hidden">
        <table mat-table [dataSource]="empresasFiltradas()">
          <ng-container matColumnDef="razaoSocial">
            <th mat-header-cell *matHeaderCellDef>Razão Social</th>
            <td mat-cell *matCellDef="let e">
              <p class="font-medium text-gray-800">{{ e.razaoSocial }}</p>
              @if (e.nomeFantasia) {
                <p class="text-xs text-gray-400">{{ e.nomeFantasia }}</p>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="cnpj">
            <th mat-header-cell *matHeaderCellDef>CNPJ</th>
            <td mat-cell *matCellDef="let e">{{ e.cnpj | cnpjMask }}</td>
          </ng-container>

          <ng-container matColumnDef="tipoEmpresa">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let e">{{ e.tipoEmpresa }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let e">
              <app-status-badge [valor]="e.status" />
            </td>
          </ng-container>

          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let e">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu>
  <a mat-menu-item [routerLink]="[e.id, 'usuarios']">
    <mat-icon>group</mat-icon> Ver usuários
  </a>
  <a mat-menu-item [routerLink]="[e.id, 'editar']">
    <mat-icon>edit</mat-icon> Editar
  </a>
  <button mat-menu-item (click)="inativar(e)" [disabled]="e.status === 'INATIVO'">
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
export class EmpresaListComponent implements OnInit {
  private readonly empresaService = inject(EmpresaService);
  private readonly appStore = inject(AppStore);
  private readonly dialog = inject(MatDialog);

  readonly colunas = ['razaoSocial', 'cnpj', 'tipoEmpresa', 'status', 'acoes'];
  readonly carregando = signal(true);
  readonly empresas = signal<Empresa[]>([]);
  readonly busca = signal('');

  readonly empresasFiltradas = computed(() => {
    const q = this.busca().toLowerCase().trim();
    if (!q) return this.empresas();
    return this.empresas().filter(e =>
      e.razaoSocial.toLowerCase().includes(q) ||
      e.cnpj.includes(q),
    );
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.empresaService.listar().subscribe({
      next: (lista) => { this.empresas.set(lista); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }

  inativar(empresa: Empresa): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Inativar empresa',
        mensagem: `Deseja inativar "${empresa.razaoSocial}"? Todos os usuários ativos serão verificados antes da operação.`,
        textoBotaoConfirmar: 'Inativar',
      },
    });

    ref.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      this.empresaService.inativar(empresa.id).subscribe({
        next: () => {
          this.appStore.sucesso('Empresa inativada com sucesso.');
          this.carregar();
        },
      });
    });
  }
}

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
import { MatSelectModule } from '@angular/material/select';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AppStore } from '../../../store/app.store';
import { Usuario } from '../../../core/models/usuario.model';
import { PerfilUsuario } from '../../../core/models/enums';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { CpfMaskPipe } from '../../../shared/pipes/cpf-mask.pipe';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatMenuModule, MatSelectModule,
    StatusBadgeComponent, PageHeaderComponent, EmptyStateComponent,
    StatusLabelPipe, CpfMaskPipe,
  ],
  template: `
    <app-page-header titulo="Usuários" subtitulo="Gerencie auditores, responsáveis e administradores">
      <a mat-flat-button color="primary" routerLink="novo">
        <mat-icon>person_add</mat-icon> Novo usuário
      </a>
    </app-page-header>

    <div class="flex gap-3 mb-4 flex-wrap">
      <mat-form-field appearance="outline" class="flex-1 min-w-48">
        <mat-label>Buscar</mat-label>
        <input matInput [(ngModel)]="busca" (ngModelChange)="busca.set($event)" placeholder="Nome ou e-mail..." />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-52">
        <mat-label>Filtrar por perfil</mat-label>
        <mat-select [(ngModel)]="filtroPerfil" (ngModelChange)="carregar()">
          <mat-option value="">Todos</mat-option>
          <mat-option value="AUDITOR">Auditor</mat-option>
          <mat-option value="RAC">Responsável (RAC)</mat-option>
          <mat-option value="ADMIN">Administrador</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    @if (carregando()) {
      <div class="space-y-2">
        @for (_ of [1,2,3,4]; track $index) {
          <div class="h-12 bg-gray-100 rounded animate-pulse"></div>
        }
      </div>
    } @else if (usuariosFiltrados().length === 0) {
      <app-empty-state icone="group" titulo="Nenhum usuário encontrado" />
    } @else {
      <div class="mat-elevation-z1 rounded-xl overflow-hidden">
        <table mat-table [dataSource]="usuariosFiltrados()">
          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let u">
              <p class="font-medium text-gray-800">{{ u.nome }}</p>
              <p class="text-xs text-gray-400">{{ u.email }}</p>
            </td>
          </ng-container>

          <ng-container matColumnDef="cpf">
            <th mat-header-cell *matHeaderCellDef>CPF</th>
            <td mat-cell *matCellDef="let u">{{ u.cpf | cpfMask }}</td>
          </ng-container>

          <ng-container matColumnDef="perfil">
            <th mat-header-cell *matHeaderCellDef>Perfil</th>
            <td mat-cell *matCellDef="let u">{{ u.perfil | statusLabel }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let u"><app-status-badge [valor]="u.status" /></td>
          </ng-container>

          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let u">
              <a mat-icon-button [routerLink]="[u.id, 'editar']">
                <mat-icon>edit</mat-icon>
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
        </table>
      </div>
    }
  `,
})
export class UsuarioListComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  readonly colunas = ['nome', 'cpf', 'perfil', 'status', 'acoes'];
  readonly carregando = signal(true);
  readonly usuarios = signal<Usuario[]>([]);
  readonly busca = signal('');
  filtroPerfil = '';

  readonly usuariosFiltrados = computed(() => {
    const q = this.busca().toLowerCase().trim();
    if (!q) return this.usuarios();
    return this.usuarios().filter(u =>
      !q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  });

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando.set(true);
    const perfil = this.filtroPerfil as PerfilUsuario | undefined;
    this.usuarioService.listar(perfil || undefined).subscribe({
      next: (lista) => { this.usuarios.set(lista); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }
}

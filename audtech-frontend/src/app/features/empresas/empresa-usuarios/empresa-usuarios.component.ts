import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { UsuarioService } from '../../../core/services/usuario.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { Usuario } from '../../../core/models/usuario.model';
import { Empresa } from '../../../core/models/usuario.model';
import { PerfilUsuario } from '../../../core/models/enums';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { CpfMaskPipe } from '../../../shared/pipes/cpf-mask.pipe';
import { MatDialog } from '@angular/material/dialog';
import { AppStore } from '../../../store/app.store';
import { ResetarSenhaDialogComponent } from './resetar-senha-dialog.component';
import { TrocarAdminDialogComponent } from './trocar-admin-dialog.component';

@Component({
  selector: 'app-empresa-usuarios',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule,
    StatusBadgeComponent, PageHeaderComponent,
    EmptyStateComponent, StatusLabelPipe, CpfMaskPipe,
  ],
  template: `
    <app-page-header
      [titulo]="'Usuários — ' + (empresa()?.razaoSocial ?? '...')"
      subtitulo="Usuários cadastrados nesta empresa"
      [breadcrumb]="[
        { label: 'Empresas', url: '/empresas' },
        { label: empresa()?.razaoSocial ?? '...', url: '/empresas' },
        { label: 'Usuários' }
      ]"
    />

    <!-- Filtros -->
    <div class="flex gap-3 mb-4 flex-wrap">
      <mat-form-field appearance="outline" class="flex-1 min-w-48">
        <mat-label>Buscar</mat-label>
        <input matInput [ngModel]="busca()" (ngModelChange)="busca.set($event)" placeholder="Nome ou e-mail..." />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-52">
        <mat-label>Filtrar por perfil</mat-label>
        <mat-select [ngModel]="filtroPerfil()" (ngModelChange)="filtroPerfil.set($event)">
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

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let u">
              @if (u.perfil === 'ADMIN') {
                <button mat-icon-button matTooltip="Redefinir senha"
                  (click)="resetarSenha(u)">
                  <mat-icon class="text-indigo-600">lock_reset</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Trocar administrador"
                  (click)="trocarAdmin()">
                  <mat-icon class="text-amber-600">manage_accounts</mat-icon>
                </button>
              }
            </td>
          </ng-container>
        </table>
      </div>
    }
  `,
})
export class EmpresaUsuariosComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly empresaService = inject(EmpresaService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly appStore = inject(AppStore);

  readonly colunas = ['nome', 'cpf', 'perfil', 'status', 'acoes'];
  readonly carregando = signal(true);
  readonly usuarios = signal<Usuario[]>([]);
  readonly empresa = signal<Empresa | null>(null);
  readonly busca = signal('');
  readonly filtroPerfil = signal('');

  private empresaId!: number;

  readonly usuariosFiltrados = computed(() => {
    const q = this.busca().toLowerCase();
    const p = this.filtroPerfil();
    return this.usuarios().filter(u => {
      const buscaOk = !q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const perfilOk = !p || u.perfil === p;
      return buscaOk && perfilOk;
    });
  });

  ngOnInit(): void {
    this.empresaId = this.route.snapshot.params['id'];

    // Carrega dados da empresa para o título
    this.empresaService.buscar(this.empresaId).subscribe(e => this.empresa.set(e));

    // Carrega usuários
    this.usuarioService.listarPorEmpresa(this.empresaId).subscribe({
      next: (lista) => { this.usuarios.set(lista); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }

  resetarSenha(usuario: Usuario): void {
    const ref = this.dialog.open(ResetarSenhaDialogComponent, {
      width: '420px',
    });

    ref.afterClosed().subscribe(novaSenha => {
      if (!novaSenha) return;
      this.usuarioService.resetarSenha(usuario.id, novaSenha).subscribe({
        next: () => this.appStore.sucesso(`Senha de ${usuario.nome} redefinida com sucesso.`),
        error: () => this.appStore.erro('Erro ao redefinir senha.'),
      });
    });
  }

  trocarAdmin(): void {
    const ref = this.dialog.open(TrocarAdminDialogComponent, {
      width: '480px',
    });

    ref.afterClosed().subscribe(dto => {
      if (!dto) return;
      this.usuarioService.trocarAdmin(this.empresaId, dto).subscribe({
        next: () => {
          this.appStore.sucesso('Administrador trocado com sucesso.');
          // Recarrega a lista para refletir o admin inativado
          this.usuarioService.listarPorEmpresa(this.empresaId).subscribe(
            lista => this.usuarios.set(lista),
          );
        },
        error: () => this.appStore.erro('Erro ao trocar administrador.'),
      });
    });
  }
}
import {
  Component, inject, signal, computed, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthStore } from '../../store/auth.store';
import { AppStore } from '../../store/app.store';
import { AuthService } from '../../core/services/auth.service';
import { PerfilUsuario } from '../../core/models/enums';

interface MenuItem {
  label: string;
  icon: string;
  rota: string;
  perfis?: PerfilUsuario[];
}

const MENU_ITENS: MenuItem[] = [
  { label: 'Dashboard', icon: 'dashboard', rota: '/dashboard', perfis: [PerfilUsuario.SUPERADMIN, PerfilUsuario.ADMIN, PerfilUsuario.AUDITOR, PerfilUsuario.RAC] },
  { label: 'Empresas', icon: 'business', rota: '/empresas', perfis: [PerfilUsuario.SUPERADMIN] },
  { label: 'Templates Padrão', icon: 'library_books', rota: '/templates-globais', perfis: [PerfilUsuario.SUPERADMIN] },
  { label: 'Usuários', icon: 'group', rota: '/usuarios', perfis: [PerfilUsuario.ADMIN] },
  { label: 'Templates', icon: 'checklist', rota: '/checklist-templates', perfis: [PerfilUsuario.ADMIN] },
  { label: 'Auditorias', icon: 'fact_check', rota: '/checklist-execucoes', perfis: [PerfilUsuario.ADMIN, PerfilUsuario.AUDITOR] },
  { label: 'Planos de Ação', icon: 'assignment_turned_in', rota: '/planos-acao', perfis: [PerfilUsuario.ADMIN, PerfilUsuario.RAC] },
];

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  template: `
    <mat-sidenav-container class="h-screen">

      <!-- Sidenav -->
      <mat-sidenav
        #sidenav
        [mode]="mobile() ? 'over' : 'side'"
        [opened]="!mobile()"
        class="w-64"
      >
        <!-- Logo -->
        <div class="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div class="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center">
            <mat-icon class="text-white" style="font-size:18px;width:18px;height:18px">verified</mat-icon>
          </div>
          <span class="text-lg font-medium text-gray-800">AUDTECH</span>
        </div>

        <!-- Menu -->
        <mat-nav-list class="pt-2">
          @for (item of menuVisivel(); track item.rota) {
            <a
              mat-list-item
              [routerLink]="item.rota"
              routerLinkActive="bg-indigo-50 !text-indigo-700"
              class="mx-2 rounded-lg mb-0.5 transition-colors"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <!-- Usuário logado -->
        <div class="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span class="text-indigo-700 font-medium text-sm">
                {{ iniciais() }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ usuario()?.nome }}</p>
              <p class="text-xs text-gray-400 truncate">
                {{ usuario()?.nomeEmpresa ?? 'Super Administrador' }}
              </p>
            </div>
            <button
              mat-icon-button
              matTooltip="Sair"
              (click)="logout()"
              class="shrink-0"
            >
              <mat-icon class="text-gray-400">logout</mat-icon>
            </button>
          </div>
        </div>
      </mat-sidenav>

      <!-- Conteúdo principal -->
      <mat-sidenav-content>
        <!-- Toolbar mobile -->
        <mat-toolbar class="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
          @if (mobile()) {
            <button mat-icon-button (click)="sidenav.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="text-base font-medium text-gray-700 ml-2">{{ tituloPagina() }}</span>
          <span class="flex-1"></span>

          <!-- Loading indicator -->
          @if (loading()) {
            <mat-icon class="animate-spin text-indigo-600">refresh</mat-icon>
          }
        </mat-toolbar>

        <!-- Rota ativa -->
        <main class="page-container">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    mat-sidenav { border-right: 1px solid #f0f0f0; }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `],
})
export class MainLayoutComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly appStore = inject(AppStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly usuario = this.authStore.usuario;
  readonly loading = this.appStore.loading;
  readonly mobile = signal(window.innerWidth < 768);
  readonly tituloPagina = signal('');

  private readonly notificacoes$ = toObservable(this.appStore.notificacoes);

  readonly iniciais = computed(() => {
    const nome = this.usuario()?.nome ?? '';
    return nome
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  });

  readonly menuVisivel = computed(() => {
    const perfil = this.authStore.perfil();
    return MENU_ITENS.filter(item =>
      !item.perfis || (perfil && item.perfis.includes(perfil)),
    );
  });

  ngOnInit(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const rota = this.router.url.split('?')[0];
        const item = MENU_ITENS.find(m => rota.startsWith(m.rota));
        this.tituloPagina.set(item?.label ?? 'AUDTECH');
      });

    // ✅ Agora só subscreve aqui, toObservable() já foi chamado no field
    this.notificacoes$.subscribe(lista => {
      const ultima = lista[lista.length - 1];
      if (!ultima) return;
      this.snackBar.open(ultima.mensagem, 'Fechar', {
        duration: 4000,
        panelClass:
          ultima.tipo === 'sucesso' ? 'snack-sucesso'
            : ultima.tipo === 'erro' ? 'snack-erro'
              : undefined,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    });

    window.addEventListener('resize', () => {
      this.mobile.set(window.innerWidth < 768);
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
import {
  Component, inject, signal, OnInit, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { DashboardService, DashboardDados, DashboardSuperAdminDados } from '../../core/services/dashboard.service';
import { AuthStore } from '../../store/auth.store';
import { AppStore } from '../../store/app.store';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PerfilUsuario } from '../../core/models/enums';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDividerModule,
    StatusBadgeComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header titulo="Dashboard" [subtitulo]="subtitulo()" />

    @if (carregando()) {
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        @for (_ of [1,2,3,4]; track $index) {
          <div class="h-28 bg-gray-100 rounded-xl animate-pulse"></div>
        }
      </div>
    }

    <!-- ── DASHBOARD SUPERADMIN ─────────────────────────────────────── -->
    @if (!carregando() && isSuperAdmin() && dadosSuperAdmin()) {
      <!-- Cards de totais -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <mat-card class="card-shadow">
          <mat-card-content class="pt-4">
            <p class="text-3xl font-medium text-gray-800">{{ dadosSuperAdmin()!.totalEmpresas }}</p>
            <p class="text-sm text-gray-400 mt-1">Total de Empresas</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="card-shadow">
          <mat-card-content class="pt-4">
            <p class="text-3xl font-medium text-green-600">{{ dadosSuperAdmin()!.empresasAtivas }}</p>
            <p class="text-sm text-gray-400 mt-1">Empresas Ativas</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="card-shadow">
          <mat-card-content class="pt-4">
            <p class="text-3xl font-medium text-red-500">{{ dadosSuperAdmin()!.empresasInativas }}</p>
            <p class="text-sm text-gray-400 mt-1">Empresas Inativas</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="card-shadow">
          <mat-card-content class="pt-4">
            <p class="text-3xl font-medium text-indigo-700">{{ dadosSuperAdmin()!.totalUsuarios }}</p>
            <p class="text-sm text-gray-400 mt-1">Total de Usuários</p>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Auditorias por status global -->
      @if (dadosSuperAdmin()!.auditoriasPorStatus.length) {
        <mat-card class="card-shadow mb-6">
          <mat-card-header>
            <mat-card-title class="text-base">Auditorias por Status (Global)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              @for (item of dadosSuperAdmin()!.auditoriasPorStatus; track item.status) {
                <div class="flex items-center gap-3">
                  <app-status-badge [valor]="item.status" />
                  <span class="text-lg font-medium text-gray-700">{{ item.total }}</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Top 5 empresas com mais auditorias -->
      @if (dadosSuperAdmin()!.empresasComMaisAuditorias.length) {
        <mat-card class="card-shadow mb-6">
          <mat-card-header>
            <mat-card-title class="text-base flex items-center gap-2">
              <mat-icon class="text-indigo-600">leaderboard</mat-icon>
              Top 5 Empresas com Mais Auditorias
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="divide-y divide-gray-100 mt-2">
              @for (item of dadosSuperAdmin()!.empresasComMaisAuditorias; track item.razaoSocial; let i = $index) {
                <div class="flex items-center justify-between py-3">
                  <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center justify-center">
                      {{ i + 1 }}
                    </span>
                    <p class="text-sm font-medium text-gray-700">{{ item.razaoSocial }}</p>
                  </div>
                  <span class="text-sm font-medium text-indigo-700">{{ item.total }} auditorias</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Atalho para gerenciar empresas -->
      <mat-card class="card-shadow">
        <mat-card-content class="pt-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-700">Gerenciar Empresas</p>
            <p class="text-xs text-gray-400 mt-1">Cadastre novas empresas ou edite as existentes</p>
          </div>
          <a mat-flat-button color="primary" routerLink="/empresas">
            <mat-icon>business</mat-icon> Ver Empresas
          </a>
        </mat-card-content>
      </mat-card>
    }

    <!-- ── DASHBOARD NORMAL (ADMIN, AUDITOR, RAC) ──────────────────── -->
    @if (!carregando() && !isSuperAdmin() && dados()) {

      @if (dados()!.statusChecklists) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          @for (item of dados()!.statusChecklists; track item.status) {
            <mat-card class="card-shadow">
              <mat-card-content class="pt-4">
                <p class="text-3xl font-medium text-gray-800">{{ item.total }}</p>
                <div class="mt-2">
                  <app-status-badge [valor]="item.status" />
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      @if (dados()!.statusAcoes) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          @for (item of dados()!.statusAcoes; track item.status) {
            <mat-card class="card-shadow">
              <mat-card-content class="pt-4">
                <p class="text-3xl font-medium text-gray-800">{{ item.total }}</p>
                <div class="mt-2">
                  <app-status-badge [valor]="item.status" />
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      @if (dados()!.percentualPlanosAbertos) {
        <mat-card class="card-shadow mb-6">
          <mat-card-header>
            <mat-card-title class="text-base">Conclusão dos Planos de Ação</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="flex items-center gap-4 mt-2">
              <mat-progress-bar
                mode="determinate"
                [value]="dados()!.percentualPlanosAbertos!.percentualConcluido"
                class="flex-1"
              />
              <span class="text-2xl font-medium text-indigo-700 w-16 text-right">
                {{ dados()!.percentualPlanosAbertos!.percentualConcluido }}%
              </span>
            </div>
            <p class="text-sm text-gray-400 mt-1">
              {{ dados()!.percentualPlanosAbertos!.concluidos }} de
              {{ dados()!.percentualPlanosAbertos!.total }} planos concluídos
            </p>
          </mat-card-content>
        </mat-card>
      }

      @if (dados()!.naoConformidadesPorCriticidade) {
        <mat-card class="card-shadow mb-6">
          <mat-card-header>
            <mat-card-title class="text-base">Não Conformidades por Criticidade</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="flex gap-6 mt-3">
              @for (item of dados()!.naoConformidadesPorCriticidade; track item.criticidade) {
                <div class="flex items-center gap-2">
                  <app-status-badge [valor]="item.criticidade" />
                  <span class="text-lg font-medium text-gray-700">{{ item.total }}</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      @if (dados()!.checklistsEmAtraso?.length) {
        <mat-card class="card-shadow mb-6">
          <mat-card-header>
            <mat-card-title class="text-base flex items-center gap-2">
              <mat-icon class="text-red-500">warning</mat-icon>
              Checklists em Atraso
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="divide-y divide-gray-100 mt-2">
              @for (exec of dados()!.checklistsEmAtraso; track exec.id) {
                <div class="flex items-center justify-between py-3">
                  <div>
                    <p class="text-sm font-medium text-gray-700">
                      #{{ exec.id }} — {{ exec.template?.titulo }}
                    </p>
                    <p class="text-xs text-gray-400">
                      Auditor: {{ exec.auditor?.nome }} | Prazo: {{ exec.prazo | date:'dd/MM/yyyy' }}
                    </p>
                  </div>
                  <a mat-stroked-button [routerLink]="['/checklist-execucoes', exec.id]" class="text-sm">
                    Ver
                  </a>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      @if ((dados()!.acoesProximasVencimento ?? dados()!.acoesProximas)?.length) {
        <mat-card class="card-shadow">
          <mat-card-header>
            <mat-card-title class="text-base flex items-center gap-2">
              <mat-icon class="text-amber-500">schedule</mat-icon>
              Ações com Prazo Próximo (7 dias)
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="divide-y divide-gray-100 mt-2">
              @for (acao of (dados()!.acoesProximasVencimento ?? dados()!.acoesProximas); track acao.id) {
                <div class="flex items-center justify-between py-3">
                  <div>
                    <p class="text-sm font-medium text-gray-700 line-clamp-1">{{ acao.descricao }}</p>
                    <p class="text-xs text-gray-400">
                      Resp.: {{ acao.responsavel?.nome }} | Prazo: {{ acao.prazo | date:'dd/MM/yyyy' }}
                    </p>
                  </div>
                  <app-status-badge [valor]="acao.status" />
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly authStore = inject(AuthStore);
  private readonly appStore = inject(AppStore);

  readonly dados = signal<DashboardDados | null>(null);
  readonly dadosSuperAdmin = signal<DashboardSuperAdminDados | null>(null);
  readonly carregando = signal(true);
  readonly isSuperAdmin = this.authStore.isSuperAdmin;

  readonly subtitulo = computed(() => {
    const perfil = this.authStore.perfil();
    const mapa: Partial<Record<PerfilUsuario, string>> = {
      [PerfilUsuario.SUPERADMIN]: 'Visão geral de todo o sistema',
      [PerfilUsuario.ADMIN]: 'Visão geral de todas as auditorias',
      [PerfilUsuario.AUDITOR]: 'Suas auditorias em andamento',
      [PerfilUsuario.RAC]: 'Suas ações corretivas',
    };
    return perfil ? (mapa[perfil] ?? '') : '';
  });

  ngOnInit(): void {
    if (this.authStore.isSuperAdmin()) {
      this.dashboardService.getDadosSuperAdmin().subscribe({
        next: (d) => { this.dadosSuperAdmin.set(d); this.carregando.set(false); },
        error: () => this.carregando.set(false),
      });
    } else {
      this.dashboardService.getDados().subscribe({
        next: (d) => { this.dados.set(d); this.carregando.set(false); },
        error: () => this.carregando.set(false),
      });
    }
  }
}
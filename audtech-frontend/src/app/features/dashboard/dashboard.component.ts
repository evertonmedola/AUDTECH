import {
  Component, inject, signal, OnInit, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
    MatDividerModule,
    StatusBadgeComponent,
    PageHeaderComponent,
  ],
  styles: [`
    :host {
      --indigo: #4f46e5;
      --indigo-light: #eef2ff;
      --indigo-mid: #818cf8;
      --green: #16a34a;
      --green-light: #dcfce7;
      --red: #dc2626;
      --red-light: #fee2e2;
      --amber: #d97706;
      --amber-light: #fef3c7;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-400: #9ca3af;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-800: #1f2937;
    }

    .dash-grid {
      display: grid;
      gap: 1.25rem;
    }

    /* ── KPI cards ── */
    .kpi-card {
      background: #fff;
      border-radius: 1rem;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: box-shadow .2s, transform .2s;
    }
    .kpi-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,.10);
      transform: translateY(-2px);
    }
    .kpi-icon {
      width: 3rem;
      height: 3rem;
      border-radius: .75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-icon mat-icon { font-size: 1.4rem; width: 1.4rem; height: 1.4rem; }
    .kpi-value {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -.02em;
    }
    .kpi-label {
      font-size: .75rem;
      color: var(--gray-400);
      margin-top: .25rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .kpi-sub {
      font-size: .7rem;
      margin-top: .2rem;
      font-weight: 500;
    }

    /* ── Panel cards ── */
    .panel {
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
      overflow: hidden;
    }
    .panel-header {
      padding: 1rem 1.5rem .75rem;
      display: flex;
      align-items: center;
      gap: .5rem;
      border-bottom: 1px solid var(--gray-100);
    }
    .panel-header mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
    .panel-title {
      font-size: .875rem;
      font-weight: 600;
      color: var(--gray-700);
    }
    .panel-body { padding: 1.25rem 1.5rem; }

    /* ── Status bar chart ── */
    .bar-row {
      display: flex;
      align-items: center;
      gap: .75rem;
      margin-bottom: .75rem;
    }
    .bar-row:last-child { margin-bottom: 0; }
    .bar-label { font-size: .75rem; color: var(--gray-600); width: 7rem; flex-shrink: 0; font-weight: 500; }
    .bar-track {
      flex: 1;
      background: var(--gray-100);
      border-radius: 999px;
      height: .625rem;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width .8s cubic-bezier(.4,0,.2,1);
    }
    .bar-count { font-size: .8rem; font-weight: 700; color: var(--gray-700); width: 2rem; text-align: right; }

    /* ── Ranking list ── */
    .rank-row {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .625rem 0;
      border-bottom: 1px solid var(--gray-100);
    }
    .rank-row:last-child { border-bottom: none; }
    .rank-num {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: var(--indigo-light);
      color: var(--indigo);
      font-size: .7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .rank-num.gold   { background: #fef9c3; color: #a16207; }
    .rank-num.silver { background: #f1f5f9; color: #475569; }
    .rank-num.bronze { background: #fff7ed; color: #c2410c; }
    .rank-bar-track {
      flex: 1;
      background: var(--gray-100);
      border-radius: 999px;
      height: .5rem;
      overflow: hidden;
    }
    .rank-bar-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--indigo-mid), var(--indigo));
      transition: width .9s cubic-bezier(.4,0,.2,1);
    }
    .rank-name { font-size: .8rem; font-weight: 500; color: var(--gray-700); min-width: 7rem; }
    .rank-count { font-size: .75rem; font-weight: 700; color: var(--indigo); white-space: nowrap; }

    /* ── Donut SVG chart ── */
    .donut-wrapper {
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    .donut-legend { display: flex; flex-direction: column; gap: .5rem; }
    .legend-item { display: flex; align-items: center; gap: .5rem; font-size: .8rem; color: var(--gray-700); }
    .legend-dot { width: .625rem; height: .625rem; border-radius: 50%; flex-shrink: 0; }
    .legend-count { font-weight: 700; margin-left: auto; padding-left: 1rem; }

    /* ── Progress bar custom ── */
    .progress-track {
      background: var(--gray-100);
      border-radius: 999px;
      height: .75rem;
      overflow: hidden;
      margin: .75rem 0 .5rem;
    }
    .progress-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--indigo-mid), var(--indigo));
      transition: width .9s cubic-bezier(.4,0,.2,1);
      position: relative;
    }
    .progress-fill::after {
      content: '';
      position: absolute;
      right: 0; top: 0; bottom: 0;
      width: .5rem;
      background: rgba(255,255,255,.4);
      border-radius: 999px;
    }
    .progress-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .progress-pct {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--indigo);
      letter-spacing: -.02em;
    }
    .progress-sub { font-size: .75rem; color: var(--gray-400); }

    /* ── Alert rows ── */
    .alert-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: .75rem 0;
      border-bottom: 1px solid var(--gray-100);
      gap: .75rem;
    }
    .alert-row:last-child { border-bottom: none; }
    .alert-dot {
      width: .5rem;
      height: .5rem;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .alert-name { font-size: .8rem; font-weight: 500; color: var(--gray-700); }
    .alert-meta { font-size: .7rem; color: var(--gray-400); margin-top: .15rem; }
    .alert-badge {
      font-size: .65rem;
      font-weight: 700;
      padding: .2rem .55rem;
      border-radius: 999px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ── Shortcut card ── */
    .shortcut-card {
      background: linear-gradient(135deg, var(--indigo) 0%, #6366f1 100%);
      border-radius: 1rem;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      box-shadow: 0 4px 14px rgba(79,70,229,.35);
    }
    .shortcut-text { color: rgba(255,255,255,.9); font-size: .875rem; font-weight: 600; }
    .shortcut-sub  { color: rgba(255,255,255,.6); font-size: .75rem; margin-top: .25rem; }
    .shortcut-btn {
      background: rgba(255,255,255,.15) !important;
      color: #fff !important;
      border: 1px solid rgba(255,255,255,.3) !important;
      border-radius: .625rem !important;
      backdrop-filter: blur(4px);
      font-size: .8rem !important;
      padding: 0 1rem !important;
      height: 2.25rem !important;
      display: flex;
      align-items: center;
      gap: .4rem;
      white-space: nowrap;
      flex-shrink: 0;
      text-decoration: none;
      transition: background .2s;
    }
    .shortcut-btn:hover { background: rgba(255,255,255,.25) !important; }

    /* ── Loading skeleton ── */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: .75rem;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* ── Empresa ativa/inativa ratio ── */
    .ratio-bar {
      display: flex;
      height: .5rem;
      border-radius: 999px;
      overflow: hidden;
      margin-top: .4rem;
      gap: 2px;
    }
    .ratio-active   { background: var(--green); transition: flex .9s; }
    .ratio-inactive { background: var(--red);   transition: flex .9s; }
  `],
  template: `
    <app-page-header titulo="Dashboard" [subtitulo]="subtitulo()" />

    <!-- ── SKELETON ────────────────────────────────────────────────── -->
    @if (carregando()) {
      <div class="dash-grid" style="grid-template-columns: repeat(4,1fr);">
        @for (_ of [1,2,3,4]; track $index) {
          <div class="skeleton" style="height:6rem;"></div>
        }
      </div>
      <div class="skeleton" style="height:14rem;margin-top:1.25rem;"></div>
      <div class="skeleton" style="height:10rem;margin-top:1.25rem;"></div>
    }

    <!-- ══════════════════════════════════════════════════════════════
         DASHBOARD SUPERADMIN
    ══════════════════════════════════════════════════════════════════ -->
    @if (!carregando() && isSuperAdmin() && dadosSuperAdmin()) {

      <!-- KPI row -->
      <div class="dash-grid" style="grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));margin-bottom:1.25rem;">

        <!-- Total Empresas -->
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#eef2ff;">
            <mat-icon style="color:#4f46e5;">business</mat-icon>
          </div>
          <div>
            <div class="kpi-value" style="color:#1f2937;">{{ dadosSuperAdmin()!.totalEmpresas }}</div>
            <div class="kpi-label">Total de Empresas</div>
            <div class="ratio-bar" style="width:6rem;">
              <div class="ratio-active"
                [style.flex]="dadosSuperAdmin()!.empresasAtivas"></div>
              <div class="ratio-inactive"
                [style.flex]="dadosSuperAdmin()!.empresasInativas"></div>
            </div>
          </div>
        </div>

        <!-- Ativas -->
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#dcfce7;">
            <mat-icon style="color:#16a34a;">check_circle</mat-icon>
          </div>
          <div>
            <div class="kpi-value" style="color:#16a34a;">{{ dadosSuperAdmin()!.empresasAtivas }}</div>
            <div class="kpi-label">Empresas Ativas</div>
            <div class="kpi-sub" style="color:#16a34a;">
              {{ pctAtivas() }}% do total
            </div>
          </div>
        </div>

        <!-- Inativas -->
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#fee2e2;">
            <mat-icon style="color:#dc2626;">cancel</mat-icon>
          </div>
          <div>
            <div class="kpi-value" style="color:#dc2626;">{{ dadosSuperAdmin()!.empresasInativas }}</div>
            <div class="kpi-label">Empresas Inativas</div>
          </div>
        </div>

        <!-- Usuários -->
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#ede9fe;">
            <mat-icon style="color:#7c3aed;">group</mat-icon>
          </div>
          <div>
            <div class="kpi-value" style="color:#7c3aed;">{{ dadosSuperAdmin()!.totalUsuarios }}</div>
            <div class="kpi-label">Total de Usuários</div>
          </div>
        </div>

      </div><!-- /kpi row -->

      <!-- Auditorias por Status — barra horizontal -->
      @if (dadosSuperAdmin()!.auditoriasPorStatus.length) {
        <div class="panel" style="margin-bottom:1.25rem;">
          <div class="panel-header">
            <mat-icon style="color:#4f46e5;">bar_chart</mat-icon>
            <span class="panel-title">Auditorias por Status (Global)</span>
            <span style="margin-left:auto;font-size:.75rem;color:#9ca3af;">
              Total: {{ totalAuditoriasSuperAdmin() }}
            </span>
          </div>
          <div class="panel-body">
            @for (item of dadosSuperAdmin()!.auditoriasPorStatus; track item.status) {
              <div class="bar-row">
                <span class="bar-label">{{ item.status | titlecase }}</span>
                <div class="bar-track">
                  <div class="bar-fill"
                    [style.width.%]="pctStatus(+item.total, totalAuditoriasSuperAdmin())"
                    [style.background]="corStatus(item.status)">
                  </div>
                </div>
                <span class="bar-count">{{ item.total }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Top 5 empresas -->
      @if (dadosSuperAdmin()!.empresasComMaisAuditorias.length) {
        <div class="panel" style="margin-bottom:1.25rem;">
          <div class="panel-header">
            <mat-icon style="color:#4f46e5;">leaderboard</mat-icon>
            <span class="panel-title">Top 5 Empresas com Mais Auditorias</span>
          </div>
          <div class="panel-body">
            @for (item of dadosSuperAdmin()!.empresasComMaisAuditorias; track item.razaoSocial; let i = $index) {
              <div class="rank-row">
                <span class="rank-num"
                  [class.gold]="i===0"
                  [class.silver]="i===1"
                  [class.bronze]="i===2">
                  {{ i + 1 }}
                </span>
                <span class="rank-name">{{ item.razaoSocial }}</span>
                <div class="rank-bar-track">
                  <div class="rank-bar-fill"
                    [style.width.%]="pctRank(+item.total, +dadosSuperAdmin()!.empresasComMaisAuditorias[0].total)">
                  </div>
                </div>
                <span class="rank-count">{{ item.total }} audit.</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Atalho gerenciar empresas -->
      <div class="shortcut-card">
        <div>
          <div class="shortcut-text">Gerenciar Empresas</div>
          <div class="shortcut-sub">Cadastre novas empresas ou edite as existentes</div>
        </div>
        <a class="shortcut-btn" routerLink="/empresas">
          <mat-icon style="font-size:1rem;width:1rem;height:1rem;">open_in_new</mat-icon>
          Ver Empresas
        </a>
      </div>

    }<!-- /superadmin -->

    <!-- ══════════════════════════════════════════════════════════════
         DASHBOARD ADMIN / AUDITOR / RAC
    ══════════════════════════════════════════════════════════════════ -->
    @if (!carregando() && !isSuperAdmin() && dados()) {

      <!-- Status de Checklists (Admin/Auditor) -->
      @if (dados()!.statusChecklists?.length) {
        <div class="dash-grid" style="grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));margin-bottom:1.25rem;">
          @for (item of dados()!.statusChecklists; track item.status) {
            <div class="kpi-card">
              <div class="kpi-icon" [style.background]="bgStatus(item.status)">
                <mat-icon [style.color]="corStatus(item.status)">{{ iconeStatus(item.status) }}</mat-icon>
              </div>
              <div>
                <div class="kpi-value" [style.color]="corStatus(item.status)">{{ item.total }}</div>
                <div class="kpi-label">{{ item.status | titlecase }}</div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Status de Ações (RAC) -->
      @if (dados()!.statusAcoes?.length) {
        <div class="dash-grid" style="grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));margin-bottom:1.25rem;">
          @for (item of dados()!.statusAcoes; track item.status) {
            <div class="kpi-card">
              <div class="kpi-icon" [style.background]="bgStatus(item.status)">
                <mat-icon [style.color]="corStatus(item.status)">{{ iconeAcao(item.status) }}</mat-icon>
              </div>
              <div>
                <div class="kpi-value" [style.color]="corStatus(item.status)">{{ item.total }}</div>
                <div class="kpi-label">{{ item.status | titlecase }}</div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Grid inferior: Planos de Ação + Não Conformidades -->
      <div class="dash-grid" style="grid-template-columns:1fr 1fr;margin-bottom:1.25rem;">

        <!-- Planos de Ação -->
        @if (dados()!.percentualPlanosAbertos) {
          <div class="panel">
            <div class="panel-header">
              <mat-icon style="color:#4f46e5;">task_alt</mat-icon>
              <span class="panel-title">Conclusão dos Planos de Ação</span>
            </div>
            <div class="panel-body">
              <div class="progress-meta">
                <span class="progress-sub">{{ dados()!.percentualPlanosAbertos!.concluidos }} de {{ dados()!.percentualPlanosAbertos!.total }} concluídos</span>
                <span class="progress-pct">{{ dados()!.percentualPlanosAbertos!.percentualConcluido }}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill"
                  [style.width.%]="dados()!.percentualPlanosAbertos!.percentualConcluido">
                </div>
              </div>
              <!-- Mini stats -->
              <div style="display:flex;gap:1rem;margin-top:.75rem;">
                <div style="flex:1;background:#dcfce7;border-radius:.625rem;padding:.5rem .75rem;">
                  <div style="font-size:1.1rem;font-weight:700;color:#16a34a;">{{ dados()!.percentualPlanosAbertos!.concluidos }}</div>
                  <div style="font-size:.7rem;color:#16a34a;font-weight:500;">Concluídos</div>
                </div>
                <div style="flex:1;background:#fef3c7;border-radius:.625rem;padding:.5rem .75rem;">
                  <div style="font-size:1.1rem;font-weight:700;color:#d97706;">{{ dados()!.percentualPlanosAbertos!.total - dados()!.percentualPlanosAbertos!.concluidos }}</div>
                  <div style="font-size:.7rem;color:#d97706;font-weight:500;">Em Aberto</div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Não Conformidades por Criticidade — Donut SVG -->
        @if (dados()!.naoConformidadesPorCriticidade?.length) {
          <div class="panel">
            <div class="panel-header">
              <mat-icon style="color:#dc2626;">report_problem</mat-icon>
              <span class="panel-title">Não Conformidades por Criticidade</span>
            </div>
            <div class="panel-body">
              <div class="donut-wrapper">
                <!-- Donut SVG -->
                <svg width="110" height="110" viewBox="0 0 110 110" style="flex-shrink:0;">
                  <circle cx="55" cy="55" r="40" fill="none" stroke="#f3f4f6" stroke-width="18"/>
                  @for (seg of donutSegments(); track seg.label; let i = $index) {
                    <circle
                      cx="55" cy="55" r="40"
                      fill="none"
                      [attr.stroke]="seg.color"
                      stroke-width="18"
                      [attr.stroke-dasharray]="seg.dash + ' ' + seg.gap"
                      [attr.stroke-dashoffset]="seg.offset"
                      stroke-linecap="butt"
                      transform="rotate(-90 55 55)"
                    />
                  }
                  <text x="55" y="50" text-anchor="middle" font-size="18" font-weight="700" fill="#1f2937">{{ totalNC() }}</text>
                  <text x="55" y="65" text-anchor="middle" font-size="9" fill="#9ca3af">total</text>
                </svg>
                <!-- Legend -->
                <div class="donut-legend">
                  @for (seg of donutSegments(); track seg.label) {
                    <div class="legend-item">
                      <div class="legend-dot" [style.background]="seg.color"></div>
                      <span>{{ seg.label | titlecase }}</span>
                      <span class="legend-count" [style.color]="seg.color">{{ seg.value }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }

      </div><!-- /grid inferior -->

      <!-- Checklists em Atraso -->
      @if (dados()!.checklistsEmAtraso?.length) {
        <div class="panel" style="margin-bottom:1.25rem;">
          <div class="panel-header">
            <mat-icon style="color:#dc2626;">warning</mat-icon>
            <span class="panel-title">Checklists em Atraso</span>
            <span style="margin-left:auto;background:#fee2e2;color:#dc2626;font-size:.65rem;font-weight:700;padding:.15rem .5rem;border-radius:999px;">
              {{ dados()!.checklistsEmAtraso!.length }}
            </span>
          </div>
          <div class="panel-body" style="padding-top:.5rem;padding-bottom:.5rem;">
            @for (exec of dados()!.checklistsEmAtraso; track exec.id) {
              <div class="alert-row">
                <div class="alert-dot" style="background:#dc2626;"></div>
                <div style="flex:1;min-width:0;">
                  <div class="alert-name">#{{ exec.id }} — {{ exec.template?.titulo }}</div>
                  <div class="alert-meta">
                    Auditor: {{ exec.auditor?.nome }} &nbsp;|&nbsp; Prazo: {{ exec.prazo | date:'dd/MM/yyyy' }}
                  </div>
                </div>
                <a mat-stroked-button [routerLink]="['/checklist-execucoes', exec.id]"
                  style="font-size:.75rem;min-width:3.5rem;height:2rem;line-height:2rem;">
                  Ver
                </a>
              </div>
            }
          </div>
        </div>
      }

      <!-- Ações com Prazo Próximo -->
      @if ((dados()!.acoesProximasVencimento ?? dados()!.acoesProximas)?.length) {
        <div class="panel">
          <div class="panel-header">
            <mat-icon style="color:#d97706;">schedule</mat-icon>
            <span class="panel-title">Ações com Prazo Próximo (7 dias)</span>
            <span style="margin-left:auto;background:#fef3c7;color:#d97706;font-size:.65rem;font-weight:700;padding:.15rem .5rem;border-radius:999px;">
              {{ (dados()!.acoesProximasVencimento ?? dados()!.acoesProximas)!.length }}
            </span>
          </div>
          <div class="panel-body" style="padding-top:.5rem;padding-bottom:.5rem;">
            @for (acao of (dados()!.acoesProximasVencimento ?? dados()!.acoesProximas); track acao.id) {
              <div class="alert-row">
                <div class="alert-dot" [style.background]="corStatus(acao.status)"></div>
                <div style="flex:1;min-width:0;">
                  <div class="alert-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    {{ acao.descricao }}
                  </div>
                  <div class="alert-meta">
                    Resp.: {{ acao.responsavel?.nome }} &nbsp;|&nbsp; Prazo: {{ acao.prazo | date:'dd/MM/yyyy' }}
                  </div>
                </div>
                <app-status-badge [valor]="acao.status" />
              </div>
            }
          </div>
        </div>
      }

    }<!-- /admin -->
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

  // ── Computed helpers ──────────────────────────────────────────────────────

  readonly pctAtivas = computed(() => {
    const d = this.dadosSuperAdmin();
    if (!d || d.totalEmpresas === 0) return 0;
    return Math.round((d.empresasAtivas / d.totalEmpresas) * 100);
  });

  readonly totalAuditoriasSuperAdmin = computed(() => {
    const d = this.dadosSuperAdmin();
    if (!d) return 0;
    return d.auditoriasPorStatus.reduce((s, i) => s + Number(i.total), 0);
  });

  readonly totalNC = computed(() => {
    const nc = this.dados()?.naoConformidadesPorCriticidade;
    if (!nc) return 0;
    return nc.reduce((s, i) => s + Number(i.total), 0);
  });

  readonly donutSegments = computed(() => {
    const nc = this.dados()?.naoConformidadesPorCriticidade;
    if (!nc || !nc.length) return [];
    const circum = 2 * Math.PI * 40; // r=40
    const total = nc.reduce((s, i) => s + Number(i.total), 0);
    if (total === 0) return [];

    const palette: Record<string, string> = {
      menor: '#22c55e',
      moderada: '#f59e0b',
      grave: '#f97316',
      critica: '#ef4444',
      crítica: '#ef4444',
    };

    let offset = 0;
    return nc.map(item => {
      const val = Number(item.total);
      const dash = (val / total) * circum;
      const gap = circum - dash;
      const key = (item.criticidade ?? '').toLowerCase();
      const color = palette[key] ?? '#818cf8';
      const seg = { label: item.criticidade, value: val, color, dash, gap, offset: -offset };
      offset += dash;
      return seg;
    });
  });

  // ── Utility methods ───────────────────────────────────────────────────────

  pctStatus(val: number, total: number): number {
    return total > 0 ? Math.round((val / total) * 100) : 0;
  }

  pctRank(val: number, max: number): number {
    return max > 0 ? Math.round((val / max) * 100) : 0;
  }

  corStatus(status: string): string {
    const s = (status ?? '').toLowerCase().replace(/_/g, ' ');
    if (s.includes('conclu') || s.includes('ativo')) return '#16a34a';
    if (s.includes('atraso') || s.includes('inativ') || s.includes('critica') || s.includes('crítica')) return '#dc2626';
    if (s.includes('andamento') || s.includes('grave') || s.includes('progress')) return '#f97316';
    if (s.includes('pendente') || s.includes('moderada') || s.includes('aguardando')) return '#d97706';
    if (s.includes('menor')) return '#22c55e';
    return '#6366f1';
  }

  bgStatus(status: string): string {
    const cor = this.corStatus(status);
    const mapa: Record<string, string> = {
      '#16a34a': '#dcfce7',
      '#dc2626': '#fee2e2',
      '#f97316': '#ffedd5',
      '#d97706': '#fef3c7',
      '#22c55e': '#dcfce7',
      '#6366f1': '#eef2ff',
    };
    return mapa[cor] ?? '#eef2ff';
  }

  iconeStatus(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s.includes('conclu')) return 'check_circle';
    if (s.includes('atraso')) return 'warning';
    if (s.includes('andamento')) return 'sync';
    if (s.includes('pendente')) return 'hourglass_empty';
    return 'assignment';
  }

  iconeAcao(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s.includes('conclu')) return 'task_alt';
    if (s.includes('andamento')) return 'autorenew';
    if (s.includes('pendente')) return 'pending_actions';
    return 'assignment_turned_in';
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

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
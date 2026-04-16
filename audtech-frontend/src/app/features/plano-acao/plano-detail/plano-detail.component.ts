import {
  Component, inject, signal, OnInit, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { PlanoAcaoService } from '../../../core/services/plano-acao.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { UploadService } from '../../../core/services/upload.service';
import { AuthStore } from '../../../store/auth.store';
import { AppStore } from '../../../store/app.store';
import { PlanoAcao, AcaoCorretiva } from '../../../core/models/plano-acao.model';
import { Usuario } from '../../../core/models/usuario.model';
import { StatusAcao, PerfilUsuario } from '../../../core/models/enums';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-plano-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDividerModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule, MatExpansionModule,
    StatusBadgeComponent, PageHeaderComponent, FileUploadComponent,
    EmptyStateComponent,
  ],
  template: `
    @if (carregando()) {
      <div class="space-y-3">
        @for (_ of [1,2,3]; track $index) {
          <div class="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
        }
      </div>
    }

    @if (!carregando() && plano()) {
      <app-page-header
        titulo="Plano de Ação"
        [subtitulo]="'Auditoria #' + plano()!.checklistExecucaoId"
        [breadcrumb]="[{ label: 'Planos de Ação', url: '/planos-acao' }, { label: 'Detalhe' }]"
      >
        <app-status-badge [valor]="plano()!.status" />
        <a mat-stroked-button [routerLink]="['/checklist-execucoes', plano()!.checklistExecucaoId]">
          <mat-icon>open_in_new</mat-icon> Ver auditoria
        </a>
      </app-page-header>

      <!-- Resumo -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <mat-card class="card-shadow text-center">
          <mat-card-content class="pt-4">
            <p class="text-3xl font-medium text-gray-800">{{ totalAcoes() }}</p>
            <p class="text-xs text-gray-400 mt-1">Total de ações</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="card-shadow text-center">
          <mat-card-content class="pt-4">
            <p class="text-3xl font-medium text-green-600">{{ acoesConcluidas() }}</p>
            <p class="text-xs text-gray-400 mt-1">Concluídas</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="card-shadow text-center">
          <mat-card-content class="pt-4">
            <p class="text-3xl font-medium text-red-500">{{ acoesEmAtraso() }}</p>
            <p class="text-xs text-gray-400 mt-1">Em atraso</p>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Lista de ações -->
      @if (plano()!.acoesCorretivas.length === 0) {
        <app-empty-state icone="assignment" titulo="Nenhuma ação registrada" />
      }

      <mat-accordion>
        @for (acao of plano()!.acoesCorretivas; track acao.id) {
          <mat-expansion-panel class="mb-3 card-shadow rounded-xl" [class.border-l-4]="true"
            [class.border-red-400]="acao.status === 'EM_ATRASO'"
            [class.border-green-400]="acao.status === 'CONCLUIDO'"
            [class.border-gray-300]="acao.status === 'PENDENTE' || acao.status === 'CANCELADO'"
            [class.border-blue-400]="acao.status === 'EM_ANDAMENTO'"
          >
            <mat-expansion-panel-header>
              <mat-panel-title class="flex items-center gap-3">
                <app-status-badge [valor]="acao.status" />
                <span class="text-sm font-medium text-gray-700 line-clamp-1">
                  {{ acao.descricao }}
                </span>
              </mat-panel-title>
              <mat-panel-description class="text-xs text-gray-400">
                Prazo: {{ acao.prazo | date:'dd/MM/yyyy' }} |
                Resp.: {{ acao.responsavel?.nome ?? 'Não atribuído' }}
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="pt-2 pb-2">
              <!-- Não conformidade de origem -->
              @if (acao.naoConformidade) {
                <div class="bg-red-50 rounded-lg p-3 mb-4 text-sm">
                  <p class="text-xs font-medium text-red-600 mb-1">Originada de não conformidade</p>
                  <div class="flex items-center gap-2">
                    <app-status-badge [valor]="acao.naoConformidade.criticidade" />
                    <span class="text-gray-700">{{ acao.naoConformidade.descricao }}</span>
                  </div>
                </div>
              }

              <!-- Evidências da ação -->
              @if (acao.evidencias.length > 0) {
                <div class="mb-4">
                  <p class="text-xs font-medium text-gray-500 mb-2">Evidências comprobatórias</p>
                  <div class="flex flex-wrap gap-2">
                    @for (ev of acao.evidencias; track ev.id) {
                      <div class="relative">
                        @if (uploadService.isImagem(ev.nomeOriginal)) {
                          <img
                            [src]="uploadService.urlArquivo(ev.arquivoUrl)"
                            class="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                        } @else {
                          <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <mat-icon class="text-red-400">picture_as_pdf</mat-icon>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Upload de evidência -->
              @if (podeEditarAcao(acao)) {
                <div class="mb-4">
                  <p class="text-xs font-medium text-gray-500 mb-2">
                    Adicionar evidência
                    @if (acao.status !== 'CONCLUIDO') {
                      <span class="text-gray-400">(obrigatória para concluir)</span>
                    }
                  </p>
                  <app-file-upload
                    (arquivoChange)="onEvidenciaAcao(acao, $event)"
                    [carregando]="uploadandoAcao() === acao.id"
                  />
                </div>
              }

              <!-- Formulário de edição -->
              @if (podeEditarAcao(acao)) {
                <mat-divider class="mb-4" />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  @if (isAdmin()) {
                    <mat-form-field appearance="outline">
                      <mat-label>Responsável</mat-label>
                      <mat-select
                        [value]="acao.responsavelId"
                        (selectionChange)="atualizarAcao(acao, { responsavelId: $event.value })"
                      >
                        @for (r of racs(); track r.id) {
                          <mat-option [value]="r.id">{{ r.nome }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  }

                  <mat-form-field appearance="outline">
                    <mat-label>Status</mat-label>
                    <mat-select
                      [value]="acao.status"
                      (selectionChange)="mudarStatus(acao, $event.value)"
                    >
                      <mat-option value="PENDENTE">Pendente</mat-option>
                      <mat-option value="EM_ANDAMENTO">Em Andamento</mat-option>
                      <mat-option value="CONCLUIDO">Concluído</mat-option>
                      <mat-option value="CANCELADO">Cancelado</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <!-- Justificativa de cancelamento -->
                @if (acao.status === 'CANCELADO' || justificandoAcao() === acao.id) {
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Justificativa de cancelamento *</mat-label>
                    <textarea matInput rows="2"
                      [value]="acao.justificativaCancelamento ?? ''"
                      (blur)="atualizarAcao(acao, { justificativaCancelamento: $any($event.target).value })"
                    ></textarea>
                  </mat-form-field>
                }
              }
            </div>
          </mat-expansion-panel>
        }
      </mat-accordion>
    }
  `,
})
export class PlanoDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly planoService = inject(PlanoAcaoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly authStore = inject(AuthStore);
  private readonly appStore = inject(AppStore);
  readonly uploadService = inject(UploadService);

  readonly plano = signal<PlanoAcao | null>(null);
  readonly racs = signal<Usuario[]>([]);
  readonly carregando = signal(true);
  readonly uploadandoAcao = signal<number | null>(null);
  readonly justificandoAcao = signal<number | null>(null);

  readonly isAdmin = this.authStore.isAdmin;
  readonly isRac = this.authStore.isRac;

  readonly totalAcoes = computed(() => this.plano()?.acoesCorretivas.length ?? 0);
  readonly acoesConcluidas = computed(() =>
    this.plano()?.acoesCorretivas.filter(a => a.status === StatusAcao.CONCLUIDO || a.status === StatusAcao.CANCELADO).length ?? 0,
  );
  readonly acoesEmAtraso = computed(() =>
    this.plano()?.acoesCorretivas.filter(a => a.status === StatusAcao.EM_ATRASO).length ?? 0,
  );

  ngOnInit(): void {
    const execucaoId = +this.route.snapshot.params['execucaoId'];
    this.planoService.buscarPorExecucao(execucaoId).subscribe({
      next: (p) => { this.plano.set(p); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
    if (this.isAdmin()) {
      this.usuarioService.racsAtivos().subscribe(lista => this.racs.set(lista));
    }
  }

  podeEditarAcao(acao: AcaoCorretiva): boolean {
    const perfil = this.authStore.perfil();
    if (perfil === PerfilUsuario.ADMIN) return true;
    if (perfil === PerfilUsuario.RAC) {
      return acao.responsavelId === this.authStore.usuario()?.id;
    }
    return false;
  }

  onEvidenciaAcao(acao: AcaoCorretiva, arquivo: File | null): void {
    if (!arquivo) return;
    this.uploadandoAcao.set(acao.id);
    this.planoService.adicionarEvidencia(acao.id, arquivo).subscribe({
      next: (ev) => {
        acao.evidencias.push(ev);
        this.uploadandoAcao.set(null);
        this.appStore.sucesso('Evidência adicionada.');
      },
      error: () => this.uploadandoAcao.set(null),
    });
  }

  mudarStatus(acao: AcaoCorretiva, novoStatus: StatusAcao): void {
    if (novoStatus === StatusAcao.CONCLUIDO && acao.evidencias.length === 0) {
      this.appStore.erro('Adicione ao menos uma evidência antes de concluir a ação.');
      return;
    }
    if (novoStatus === StatusAcao.CANCELADO) {
      this.justificandoAcao.set(acao.id);
    }
    this.atualizarAcao(acao, { status: novoStatus });
  }

  atualizarAcao(acao: AcaoCorretiva, dto: Partial<AcaoCorretiva>): void {
    this.planoService.atualizarAcao(acao.id, dto as any).subscribe({
      next: (atualizada) => {
        const plano = this.plano()!;
        const acoes = plano.acoesCorretivas.map(a =>
          a.id === atualizada.id ? { ...a, ...atualizada } : a,
        );
        this.plano.set({ ...plano, acoesCorretivas: acoes });
        this.appStore.sucesso('Ação atualizada.');
      },
    });
  }
}

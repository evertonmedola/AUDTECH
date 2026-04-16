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
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChecklistExecucaoService } from '../../../core/services/checklist-execucao.service';
import { UploadService } from '../../../core/services/upload.service';
import { AuthStore } from '../../../store/auth.store';
import { AppStore } from '../../../store/app.store';
import {
  ChecklistExecucao, ItemExecucao, GrupoItens,
  CreatePendenciaDto, CreateNaoConformidadeDto,
} from '../../../core/models/checklist.model';
import {
  ResultadoItem, CategoriaPendencia, Criticidade,
  CriticidadeAmbiental, PerfilUsuario, StatusChecklist,
} from '../../../core/models/enums';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-execucao-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatRadioModule, MatExpansionModule,
    MatDividerModule, MatChipsModule, MatProgressBarModule, MatTooltipModule,
    StatusBadgeComponent, PageHeaderComponent,
    FileUploadComponent, SignaturePadComponent,
  ],
  template: `
    @if (carregando()) {
      <div class="space-y-4">
        <div class="h-10 w-64 bg-gray-100 rounded animate-pulse"></div>
        @for (_ of [1,2,3]; track $index) {
          <div class="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
        }
      </div>
    }

    @if (!carregando() && execucao()) {
      <app-page-header
        [titulo]="execucao()!.template?.titulo ?? 'Auditoria'"
        [subtitulo]="'Auditoria #' + execucao()!.id"
        [breadcrumb]="[{ label: 'Auditorias', url: '/checklist-execucoes' }, { label: '#' + execucao()!.id }]"
      >
        <app-status-badge [valor]="execucao()!.status" />

        @if (podeAssinar() && !assinado()) {
          <button mat-flat-button color="primary" (click)="abrirAssinatura.set(true)">
            <mat-icon>draw</mat-icon> Assinar checklist
          </button>
        }
      </app-page-header>

      <!-- Progresso -->
      <mat-card class="card-shadow mb-6">
        <mat-card-content class="pt-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-600">Progresso do preenchimento</span>
            <span class="text-sm font-medium text-indigo-700">
              {{ itensRespondidos() }} / {{ totalItens() }} itens
            </span>
          </div>
          <mat-progress-bar mode="determinate" [value]="percentualProgresso()" />
        </mat-card-content>
      </mat-card>

      <!-- Aviso de checklist bloqueado -->
      @if (assinado()) {
        <div class="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
          <mat-icon class="text-green-600">verified</mat-icon>
          <div>
            <p class="text-sm font-medium text-green-800">Checklist assinado e bloqueado</p>
            <p class="text-xs text-green-600">
              Assinado em {{ execucao()!.assinadoEm | date:'dd/MM/yyyy HH:mm' }}
            </p>
          </div>
        </div>
      }

      <!-- Assinatura registrada -->
@if (assinado() && execucao()!.tipoAssinatura === 'DESENHO' && execucao()!.assinatura) {
  <mat-card class="card-shadow mb-6">
    <mat-card-header>
      <mat-card-title class="text-base flex items-center gap-2">
        <mat-icon class="text-indigo-600">draw</mat-icon>
        Assinatura Digital
      </mat-card-title>
    </mat-card-header>
    <mat-card-content class="pt-2">
      <img
        [src]="execucao()!.assinatura"
        class="max-h-32 border border-gray-200 rounded-lg bg-white p-2"
        alt="Assinatura"
      />
    </mat-card-content>
  </mat-card>
}

@if (assinado() && execucao()!.tipoAssinatura === 'CREDENCIAL') {
  <mat-card class="card-shadow mb-6">
    <mat-card-content class="pt-4 flex items-center gap-3">
      <mat-icon class="text-indigo-600">lock</mat-icon>
      <p class="text-sm text-gray-700">Assinado por confirmação de credencial (senha)</p>
    </mat-card-content>
  </mat-card>
}

      <!-- Grupos de itens -->
      @for (grupo of gruposItens(); track grupo.grupo) {
        <div class="mb-4">
          <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 px-1">
            {{ grupo.grupo || 'Geral' }}
          </h2>

          <div class="flex flex-col gap-3">
            @for (item of grupo.itens; track item.id) {
              <mat-card class="card-shadow" [class.opacity-60]="assinado()">
                <mat-card-content class="pt-4">
                  <div class="flex items-start gap-3">
                    <!-- Número -->
                    <div class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 shrink-0 mt-0.5">
                      {{ (item.itemTemplate.ordem) + 1 }}
                    </div>

                    <div class="flex-1">
                      <!-- Pergunta -->
                      <p class="text-sm text-gray-800 mb-3 leading-relaxed">
                        {{ item.itemTemplate.descricao }}
                      </p>

                      <!-- Resultado -->
                      <div class="flex flex-wrap gap-2 mb-3">
                        @for (resultado of resultados; track resultado.valor) {
                          <button
                            mat-stroked-button
                            [color]="corResultado(resultado.valor, item.resultado)"
                            [disabled]="assinado()"
                            (click)="!assinado() && salvarResultado(item, resultado.valor)"
                            class="text-sm"
                          >
                            {{ resultado.label }}
                          </button>
                        }
                      </div>

                      <!-- Observação -->
                      @if (item.resultado) {
                        <mat-form-field appearance="outline" class="w-full mb-2">
                          <mat-label>Observação</mat-label>
                          <textarea
                            matInput
                            rows="2"
                            [value]="item.observacao ?? ''"
                            [disabled]="assinado()"
                            maxlength="1000"
                            (blur)="salvarObservacao(item, $event)"
                            placeholder="Máx. 1000 caracteres"
                          ></textarea>
                          <mat-hint align="end">{{ (item.observacao ?? '').length }}/1000</mat-hint>
                        </mat-form-field>
                      }

                      <!-- Seção de não conformidade -->
                      @if (item.resultado === 'NAO_CONFORME') {
                        <div class="bg-red-50 border border-red-100 rounded-lg p-4 mb-3">

                          <!-- Evidências obrigatórias -->
                          <p class="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                            <mat-icon style="font-size:14px;width:14px;height:14px">attach_file</mat-icon>
                            Evidências fotográficas (obrigatório)
                          </p>

                          <div class="flex flex-wrap gap-2 mb-3">
                            @for (ev of item.evidencias; track ev.id) {
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
                                @if (!assinado()) {
                                  <button
                                    class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center"
                                    (click)="removerEvidencia(item, ev.id)"
                                  >
                                    <mat-icon style="font-size:10px;width:10px;height:10px">close</mat-icon>
                                  </button>
                                }
                              </div>
                            }
                          </div>

                          @if (!assinado()) {
                            <app-file-upload
                              (arquivoChange)="onEvidencia(item, $event)"
                              [carregando]="uploadandoItem() === item.id"
                            />
                          }

                          <!-- Não Conformidades registradas -->
                          @if (item.naoConformidades.length > 0) {
                            <div class="mt-3">
                              <p class="text-xs font-medium text-red-700 mb-2">Não conformidades</p>
                              @for (nc of item.naoConformidades; track nc.id) {
                                <div class="flex items-start gap-2 text-xs text-red-800 mb-1">
                                  <app-status-badge [valor]="nc.criticidade" />
                                  <span>{{ nc.descricao }}</span>
                                </div>
                              }
                            </div>
                          }

                          @if (!assinado()) {
                            <button
                              mat-button
                              class="text-red-600 mt-2"
                              (click)="abrirFormNc(item)"
                            >
                              <mat-icon>add</mat-icon> Registrar não conformidade
                            </button>
                          }
                        </div>
                      }

                      <!-- Pendências -->
                      @if (item.pendencias.length > 0) {
                        <div class="flex flex-wrap gap-2 mt-1">
                          @for (p of item.pendencias; track p.id) {
                            <span class="badge badge-atraso text-xs">
                              {{ p.categoria }} — {{ p.descricao | slice:0:40 }}
                            </span>
                          }
                        </div>
                      }

                      @if (!assinado() && item.resultado) {
                        <button
                          mat-button
                          class="text-gray-500 text-xs mt-1"
                          (click)="abrirFormPendencia(item)"
                        >
                          <mat-icon style="font-size:14px">add</mat-icon> Adicionar pendência
                        </button>
                      }
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </div>
      }

      <!-- Painel de assinatura -->
      @if (abrirAssinatura()) {
        <mat-card class="card-shadow mt-6 border-2 border-indigo-200">
          <mat-card-header>
            <mat-card-title>Assinar Checklist</mat-card-title>
            <mat-card-subtitle>Confirme que todos os itens foram verificados</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pt-4">

            <div class="flex gap-3 mb-4">
              <button
                mat-stroked-button
                [color]="tipoAssinatura() === 'DESENHO' ? 'primary' : ''"
                (click)="tipoAssinatura.set('DESENHO')"
              >
                <mat-icon>draw</mat-icon> Assinar com desenho
              </button>
              <button
                mat-stroked-button
                [color]="tipoAssinatura() === 'CREDENCIAL' ? 'primary' : ''"
                (click)="tipoAssinatura.set('CREDENCIAL')"
              >
                <mat-icon>lock</mat-icon> Confirmar com senha
              </button>
            </div>

            @if (tipoAssinatura() === 'DESENHO') {
              <app-signature-pad
                #sigPad
                (assinaturaChange)="assinaturaBase64.set($event)"
              />
            } @else {
              <mat-form-field appearance="outline" class="w-full max-w-sm">
                <mat-label>Confirme sua senha</mat-label>
                <input matInput type="password" [(ngModel)]="senhaConfirmacao" />
              </mat-form-field>
            }

            <div class="flex gap-3 mt-4">
              <button mat-stroked-button (click)="abrirAssinatura.set(false)">Cancelar</button>
              <button
                mat-flat-button color="primary"
                (click)="assinar()"
                [disabled]="!podeConfirmarAssinatura() || assinando()"
              >
                @if (assinando()) { Assinando... } @else { Confirmar assinatura }
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Mini-form de pendência (inline) -->
      @if (itemPendencia()) {
        <mat-card class="card-shadow mt-4 border border-amber-200">
          <mat-card-header>
            <mat-card-title class="text-base">Nova Pendência</mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-3">
            <div class="flex flex-col gap-3" [formGroup]="formPendencia">
              <mat-form-field appearance="outline">
                <mat-label>Categoria *</mat-label>
                <mat-select formControlName="categoria">
                  <mat-option value="DOCUMENTAL">Documental</mat-option>
                  <mat-option value="ESTRUTURAL">Estrutural</mat-option>
                  <mat-option value="AMBIENTAL">Ambiental</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Descrição *</mat-label>
                <textarea matInput formControlName="descricao" rows="2"></textarea>
              </mat-form-field>

              @if (formPendencia.get('categoria')?.value === 'DOCUMENTAL') {
                <mat-form-field appearance="outline">
                  <mat-label>Referência normativa *</mat-label>
                  <input matInput formControlName="referenciaNormativa" />
                </mat-form-field>
              }

              @if (formPendencia.get('categoria')?.value === 'AMBIENTAL') {
                <mat-form-field appearance="outline">
                  <mat-label>Criticidade ambiental *</mat-label>
                  <mat-select formControlName="criticidade">
                    <mat-option value="BAIXA">Baixa</mat-option>
                    <mat-option value="MEDIA">Média</mat-option>
                    <mat-option value="ALTA">Alta</mat-option>
                  </mat-select>
                </mat-form-field>
              }

              <div class="flex gap-3">
                <button mat-stroked-button (click)="itemPendencia.set(null)">Cancelar</button>
                <button mat-flat-button color="primary" (click)="salvarPendencia()" [disabled]="formPendencia.invalid">
                  Salvar pendência
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Mini-form de não conformidade (inline) -->
      @if (itemNc()) {
        <mat-card class="card-shadow mt-4 border border-red-200">
          <mat-card-header>
            <mat-card-title class="text-base">Nova Não Conformidade</mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-3">
            <div class="flex flex-col gap-3" [formGroup]="formNc">
              <mat-form-field appearance="outline">
                <mat-label>Descrição do problema *</mat-label>
                <textarea matInput formControlName="descricao" rows="2"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Norma / requisito descumprido</mat-label>
                <input matInput formControlName="normaReferencia" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Local / processo afetado</mat-label>
                <input matInput formControlName="localProcesso" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Criticidade *</mat-label>
                <mat-select formControlName="criticidade">
                  <mat-option value="CRITICA">Crítica — risco imediato</mat-option>
                  <mat-option value="MAIOR">Maior — impacto no sistema</mat-option>
                  <mat-option value="MENOR">Menor — desvio pontual</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="flex gap-3">
                <button mat-stroked-button (click)="itemNc.set(null)">Cancelar</button>
                <button mat-flat-button color="primary" (click)="salvarNc()" [disabled]="formNc.invalid">
                  Salvar não conformidade
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }
    }
  `,
})
export class ExecucaoDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly execucaoService = inject(ChecklistExecucaoService);
  private readonly authStore = inject(AuthStore);
  private readonly appStore = inject(AppStore);
  private readonly fb = inject(FormBuilder);
  readonly uploadService = inject(UploadService);

  readonly execucao = signal<ChecklistExecucao | null>(null);
  readonly carregando = signal(true);
  readonly uploadandoItem = signal<number | null>(null);
  readonly abrirAssinatura = signal(false);
  readonly tipoAssinatura = signal<'DESENHO' | 'CREDENCIAL'>('DESENHO');
  readonly assinaturaBase64 = signal<string | null>(null);
  readonly assinando = signal(false);
  senhaConfirmacao = '';

  readonly itemPendencia = signal<ItemExecucao | null>(null);
  readonly itemNc = signal<ItemExecucao | null>(null);

  readonly formPendencia = this.fb.group({
    categoria: ['', Validators.required],
    descricao: ['', Validators.required],
    referenciaNormativa: [''],
    criticidade: [''],
  });

  readonly formNc = this.fb.group({
    descricao: ['', Validators.required],
    normaReferencia: [''],
    localProcesso: [''],
    criticidade: ['', Validators.required],
  });

  readonly resultados = [
    { valor: ResultadoItem.CONFORME, label: 'Conforme' },
    { valor: ResultadoItem.NAO_CONFORME, label: 'Não conforme' },
    { valor: ResultadoItem.NAO_APLICAVEL, label: 'N/A' },
  ];

  readonly assinado = computed(() => !!this.execucao()?.assinadoEm);

  readonly podeAssinar = computed(() => {
    const p = this.authStore.perfil();
    return p === PerfilUsuario.AUDITOR || p === PerfilUsuario.ADMIN;
  });

  readonly gruposItens = computed<GrupoItens[]>(() => {
    const itens = this.execucao()?.itens ?? [];
    const mapa = new Map<string, ItemExecucao[]>();
    itens.forEach(item => {
      const grupo = item.itemTemplate?.grupo ?? '';
      if (!mapa.has(grupo)) mapa.set(grupo, []);
      mapa.get(grupo)!.push(item);
    });
    return Array.from(mapa.entries()).map(([grupo, itens]) => ({ grupo, itens }));
  });

  readonly totalItens = computed(() => this.execucao()?.itens.length ?? 0);
  readonly itensRespondidos = computed(() =>
    this.execucao()?.itens.filter(i => i.resultado).length ?? 0,
  );
  readonly percentualProgresso = computed(() => {
    const total = this.totalItens();
    return total > 0 ? Math.round((this.itensRespondidos() / total) * 100) : 0;
  });

  readonly podeConfirmarAssinatura = computed(() => {
    if (this.tipoAssinatura() === 'DESENHO') return !!this.assinaturaBase64();
    return this.senhaConfirmacao.length >= 8;
  });

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.carregar(id);
  }

  carregar(id: number): void {
    this.execucaoService.buscar(id).subscribe({
      next: (e) => { this.execucao.set(e); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }

  corResultado(valor: ResultadoItem, atual?: ResultadoItem): string {
    if (valor !== atual) return '';
    if (valor === ResultadoItem.CONFORME) return 'primary';
    if (valor === ResultadoItem.NAO_CONFORME) return 'warn';
    return 'accent';
  }

  salvarResultado(item: ItemExecucao, resultado: ResultadoItem): void {
    this.execucaoService.atualizarItem(
      this.execucao()!.id, item.id,
      { resultado, observacao: item.observacao, prazo: item.prazo },
    ).subscribe({
      next: (atualizado) => {
        this.atualizarItem(atualizado);
        if (resultado === ResultadoItem.NAO_CONFORME) {
          this.appStore.aviso('Item marcado como não conforme. Adicione evidências fotográficas.');
        }
      },
    });
  }

  salvarObservacao(item: ItemExecucao, e: Event): void {
    const obs = (e.target as HTMLTextAreaElement).value;
    if (obs === (item.observacao ?? '')) return;
    this.execucaoService.atualizarItem(
      this.execucao()!.id, item.id,
      { resultado: item.resultado!, observacao: obs },
    ).subscribe({ next: (at) => this.atualizarItem(at) });
  }

  onEvidencia(item: ItemExecucao, arquivo: File | null): void {
    if (!arquivo) return;
    this.uploadandoItem.set(item.id);
    this.execucaoService.adicionarEvidencia(this.execucao()!.id, item.id, arquivo).subscribe({
      next: (ev) => {
        this.uploadandoItem.set(null);
        item.evidencias.push(ev);
        this.appStore.sucesso('Evidência adicionada.');
      },
      error: () => this.uploadandoItem.set(null),
    });
  }

  removerEvidencia(item: ItemExecucao, evidenciaId: number): void {
    this.execucaoService.removerEvidencia(evidenciaId).subscribe({
      next: () => {
        item.evidencias = item.evidencias.filter(e => e.id !== evidenciaId);
        this.appStore.sucesso('Evidência removida.');
      },
    });
  }

  abrirFormPendencia(item: ItemExecucao): void {
    this.itemPendencia.set(item);
    this.formPendencia.reset();
  }

  salvarPendencia(): void {
    if (this.formPendencia.invalid) return;
    const item = this.itemPendencia()!;
    const dto = this.formPendencia.value as CreatePendenciaDto;

    this.execucaoService.adicionarPendencia(this.execucao()!.id, item.id, dto).subscribe({
      next: (p) => {
        item.pendencias.push(p);
        this.itemPendencia.set(null);
        this.appStore.sucesso('Pendência registrada.');
        if (dto.categoria === 'AMBIENTAL' && dto.criticidade === 'ALTA') {
          this.appStore.aviso('Alerta: pendência ambiental de criticidade Alta registrada!');
        }
      },
    });
  }

  abrirFormNc(item: ItemExecucao): void {
    this.itemNc.set(item);
    this.formNc.reset();
  }

  salvarNc(): void {
    if (this.formNc.invalid) return;
    const item = this.itemNc()!;
    const dto = this.formNc.value as CreateNaoConformidadeDto;

    this.execucaoService.adicionarNaoConformidade(this.execucao()!.id, item.id, dto).subscribe({
      next: (nc) => {
        item.naoConformidades.push(nc);
        this.itemNc.set(null);
        this.appStore.sucesso('Não conformidade registrada.');
      },
    });
  }

  assinar(): void {
    if (!this.podeConfirmarAssinatura()) return;
    this.assinando.set(true);

    const dto = this.tipoAssinatura() === 'DESENHO'
      ? { tipoAssinatura: 'DESENHO' as const, assinatura: this.assinaturaBase64()! }
      : { tipoAssinatura: 'CREDENCIAL' as const, senha: this.senhaConfirmacao };

    this.execucaoService.assinar(this.execucao()!.id, dto).subscribe({
      next: (e) => {
        this.execucao.set(e);
        this.abrirAssinatura.set(false);
        this.assinando.set(false);
        this.appStore.sucesso('Checklist assinado e concluído com sucesso!');
      },
      error: () => this.assinando.set(false),
    });
  }

  private atualizarItem(atualizado: ItemExecucao): void {
    const exec = this.execucao();
    if (!exec) return;
    const itens = exec.itens.map(i => i.id === atualizado.id ? { ...i, ...atualizado } : i);
    this.execucao.set({ ...exec, itens });
  }
}

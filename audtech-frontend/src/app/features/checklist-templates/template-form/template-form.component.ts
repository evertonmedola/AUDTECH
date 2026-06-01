import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  FormBuilder, Validators, ReactiveFormsModule, FormsModule,
  FormArray, FormGroup,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChecklistTemplateService } from '../../../core/services/checklist-template.service';
import { IaService, ChecklistGeradoIA } from '../../../core/services/ia.service';
import { AppStore } from '../../../store/app.store';
import { TipoNorma } from '../../../core/models/enums';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, FormsModule, DragDropModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatIconModule, MatDividerModule, MatTooltipModule,
    MatSidenavModule, MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container" autosize>

      <!-- ── Conteúdo principal ── -->
      <mat-sidenav-content>
        <app-page-header
          [titulo]="editando() ? 'Editar Template' : 'Novo Template'"
          [breadcrumb]="[{ label: 'Templates', url: '/checklist-templates' }, { label: editando() ? 'Editar' : 'Novo' }]"
        />

        <div class="max-w-3xl">
          <form [formGroup]="form" (ngSubmit)="salvar()">

            <!-- Dados do template -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <mat-form-field appearance="outline" class="md:col-span-2">
                <mat-label>Título *</mat-label>
                <input matInput formControlName="titulo" />
                @if (form.get('titulo')?.hasError('required') && form.get('titulo')?.touched) {
                  <mat-error>Título é obrigatório</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo de norma *</mat-label>
                <mat-select formControlName="tipoNorma">
                  @for (norma of normas; track norma.valor) {
                    <mat-option [value]="norma.valor">{{ norma.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Descrição</mat-label>
                <textarea matInput formControlName="descricao" rows="2"></textarea>
              </mat-form-field>
            </div>

            <mat-divider class="mb-6" />

            <!-- Itens do checklist -->
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-medium text-gray-700">
                Itens do Checklist
                <span class="ml-2 text-sm text-gray-400">({{ itens.length }})</span>
              </h2>
              <div class="flex gap-2">
                <button
                  mat-stroked-button
                  type="button"
                  (click)="abrirSidenavIA()"
                  [disabled]="editando() && possuiExecucoes()"
                >
                  <mat-icon>auto_awesome</mat-icon> Gerar com IA
                </button>
                <button
                  mat-stroked-button
                  type="button"
                  (click)="adicionarItem()"
                  [disabled]="editando() && possuiExecucoes()"
                >
                  <mat-icon>add</mat-icon> Adicionar item
                </button>
              </div>
            </div>

            @if (editando() && possuiExecucoes()) {
              <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 mb-4">
                <mat-icon class="text-amber-500 align-middle mr-1" style="font-size:16px;width:16px;height:16px">warning</mat-icon>
                Este template possui auditorias vinculadas. Os itens não podem ser alterados.
              </div>
            }

            <div
              cdkDropList
              (cdkDropListDropped)="reordenar($event)"
              class="flex flex-col gap-3 mb-6"
            >
              @for (item of itens.controls; track item; let i = $index) {
                <div
                  cdkDrag
                  [formGroup]="getItemGroup(i)"
                  class="flex gap-3 items-start bg-gray-50 border border-gray-200 rounded-xl p-4 group"
                >
                  <!-- Handle de drag -->
                  <div cdkDragHandle class="mt-3 cursor-grab text-gray-300 hover:text-gray-500">
                    <mat-icon>drag_indicator</mat-icon>
                  </div>

                  <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <mat-form-field appearance="outline">
                      <mat-label>Grupo / Seção</mat-label>
                      <input matInput formControlName="grupo" placeholder="Ex: Boas Práticas" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="md:col-span-2">
                      <mat-label>Descrição do item *</mat-label>
                      <input matInput formControlName="descricao" />
                      @if (getItemGroup(i).get('descricao')?.hasError('required') && getItemGroup(i).get('descricao')?.touched) {
                        <mat-error>Descrição é obrigatória</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <button
                    mat-icon-button
                    type="button"
                    class="mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    [matTooltip]="'Remover item'"
                    (click)="removerItem(i)"
                    [disabled]="editando() && possuiExecucoes()"
                  >
                    <mat-icon class="text-red-400">delete</mat-icon>
                  </button>
                </div>
              }
            </div>

            @if (itens.length === 0) {
              <div class="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl mb-6">
                <p class="text-gray-400 text-sm">Nenhum item adicionado.</p>
                <button mat-button type="button" (click)="adicionarItem()" class="mt-2">
                  <mat-icon>add</mat-icon> Adicionar primeiro item
                </button>
              </div>
            }

            <!-- Ações -->
            <div class="flex gap-3">
              <button mat-stroked-button type="button" routerLink="/checklist-templates">Cancelar</button>
              <button
                mat-flat-button color="primary" type="submit"
                [disabled]="form.invalid || itens.length === 0 || salvando()"
              >
                @if (salvando()) { Salvando... } @else { Salvar template }
              </button>
            </div>
          </form>
        </div>
      </mat-sidenav-content>

      <!-- ── Sidenav IA ── -->
      <mat-sidenav #sidenavIA position="end" mode="over" class="ai-sidenav">
        <div class="flex h-full flex-col overflow-hidden bg-slate-50">

          <div class="border-b border-slate-200 bg-white px-6 py-5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                  <mat-icon>auto_awesome</mat-icon>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase text-cyan-700">Assistente IA</p>
                  <h3 class="text-lg font-semibold text-slate-900">Gerar checklist</h3>
                  <p class="mt-1 text-sm leading-5 text-slate-500">
                    Descreva o contexto da auditoria e revise a sugestão antes de aplicar.
                  </p>
                </div>
              </div>
              <button mat-icon-button type="button" (click)="fecharSidenavIA()" matTooltip="Fechar painel">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>

          <div class="ai-scroll flex-1 overflow-y-auto px-6 py-5">
            <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-slate-800">Prompt</p>
                  <p class="text-xs text-slate-500">Inclua norma, área auditada e objetivo do checklist.</p>
                </div>
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-medium"
                  [class.bg-emerald-50]="promptIAValido()"
                  [class.text-emerald-700]="promptIAValido()"
                  [class.bg-slate-100]="!promptIAValido()"
                  [class.text-slate-500]="!promptIAValido()"
                >
                  {{ descricaoIA.trim().length }}/10
                </span>
              </div>

              <mat-form-field appearance="outline" class="ai-prompt-field w-full">
                <mat-label>O que a IA deve montar?</mat-label>
                <textarea
                  matInput
                  [(ngModel)]="descricaoIA"
                  rows="7"
                  placeholder="Descreva o checklist que você precisa. Ex: inspeção de equipamentos elétricos para norma ISO 45001..."
                ></textarea>
              </mat-form-field>

              <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                @for (exemplo of exemplosPromptIA; track exemplo.titulo) {
                  <button
                    mat-stroked-button
                    type="button"
                    class="ai-example-button"
                    (click)="usarExemploPromptIA(exemplo.prompt)"
                    [matTooltip]="exemplo.prompt"
                  >
                    <mat-icon>{{ exemplo.icone }}</mat-icon>
                    {{ exemplo.titulo }}
                  </button>
                }
              </div>

              <button
                mat-flat-button
                color="primary"
                type="button"
                class="mt-4 w-full"
                (click)="gerarComIA()"
                [disabled]="gerandoIA() || !promptIAValido()"
              >
                @if (gerandoIA()) {
                  <span class="inline-flex items-center justify-center gap-2">
                    <mat-spinner diameter="18" />
                    <span>Gerando sugestão...</span>
                  </span>
                } @else {
                  <span class="inline-flex items-center justify-center gap-2">
                    <mat-icon>auto_awesome</mat-icon>
                    <span>Gerar sugestão</span>
                  </span>
                }
              </button>
            </section>

            @if (gerandoIA()) {
              <section class="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
                <div class="mb-3 flex items-center gap-3">
                  <mat-spinner diameter="24" />
                  <div>
                    <p class="text-sm font-semibold text-indigo-900">Analisando o pedido</p>
                    <p class="text-xs text-indigo-700">A IA está estruturando título, norma e itens por grupo.</p>
                  </div>
                </div>
                <div class="space-y-2">
                  <div class="h-3 w-3/4 rounded bg-indigo-100"></div>
                  <div class="h-3 w-11/12 rounded bg-indigo-100"></div>
                  <div class="h-3 w-2/3 rounded bg-indigo-100"></div>
                </div>
              </section>
            }

          <!-- Preview dos itens gerados -->
          @if (sugestaoIA()) {
            <section class="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div class="border-b border-slate-200 bg-slate-900 px-4 py-4 text-white">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs font-semibold uppercase text-cyan-200">Sugestão pronta</p>
                    <h4 class="mt-1 text-base font-semibold leading-6">{{ sugestaoIA()!.titulo }}</h4>
                  </div>
                  <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                    {{ totalItensIA() }} itens
                  </span>
                </div>
                <p class="mt-3 text-sm leading-5 text-slate-200">{{ sugestaoIA()!.descricao }}</p>
              </div>
              <div class="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
                <div class="border-r border-slate-200 p-4">
                  <p class="text-xs font-semibold uppercase text-slate-500">Norma</p>
                  <p class="mt-1 text-sm font-semibold text-slate-800">{{ normaLabel(sugestaoIA()!.tipoNorma) }}</p>
                </div>
                <div class="p-4">
                  <p class="text-xs font-semibold uppercase text-slate-500">Grupos</p>
                  <p class="mt-1 text-sm font-semibold text-slate-800">{{ gruposIA().length }}</p>
                </div>
              </div>

              <div class="divide-y divide-slate-100">
                @for (grupo of gruposIA(); track grupo.nome) {
                  <div class="p-4">
                    <div class="mb-3 flex items-center justify-between gap-3">
                      <p class="text-sm font-semibold text-indigo-700">{{ grupo.nome || 'Sem grupo' }}</p>
                      <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {{ grupo.itens.length }} itens
                      </span>
                    </div>
                    <div class="space-y-2">
                      @for (item of grupo.itens; track item.ordem) {
                        <div class="flex gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-600">
                            {{ item.ordem + 1 }}
                          </span>
                          <p class="text-sm leading-5 text-slate-700">{{ item.descricao }}</p>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>

          }

          @if (!sugestaoIA() && !gerandoIA()) {
            <section class="mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-center">
              <mat-icon class="text-slate-300">chat_bubble_outline</mat-icon>
              <p class="mt-2 text-sm font-medium text-slate-600">A sugestão aparecerá aqui</p>
              <p class="mt-1 text-xs leading-5 text-slate-500">
                Depois de gerar, você poderá revisar os campos antes de preencher o formulário.
              </p>
            </section>
          }
          </div>

          <div class="border-t border-slate-200 bg-white px-6 py-4">
            @if (sugestaoIA()) {
              <div class="flex gap-2">
                <button mat-stroked-button type="button" class="flex-1" (click)="fecharSidenavIA()">
                  Cancelar
                </button>
                <button mat-flat-button color="primary" type="button" class="flex-1" (click)="aplicarSugestaoIA()">
                  <mat-icon>check</mat-icon>
                  Aplicar
                </button>
              </div>
            } @else {
              <button mat-stroked-button type="button" class="w-full" (click)="fecharSidenavIA()">
                Fechar
              </button>
            }
          </div>
        </div>
      </mat-sidenav>

    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100%;
      min-height: 100%;
    }
    mat-sidenav-content {
      padding: 0;
    }
    .ai-sidenav {
      width: min(520px, 100vw) !important;
    }
    :host ::ng-deep .ai-sidenav .mat-drawer-inner-container {
      overflow: hidden;
    }
    .ai-scroll {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;
    }
    .ai-prompt-field textarea {
      min-height: 150px;
      resize: vertical;
    }
    .ai-example-button {
      min-width: 0;
      padding-inline: 10px;
    }
    .ai-example-button mat-icon {
      margin-right: 4px;
    }
    @media (max-width: 640px) {
      .ai-sidenav {
        width: 100vw !important;
      }
    }
  `],
})
export class TemplateFormComponent implements OnInit {
  @ViewChild('sidenavIA') sidenavIA!: MatSidenav;

  private readonly fb = inject(FormBuilder);
  private readonly templateService = inject(ChecklistTemplateService);
  private readonly iaService = inject(IaService);
  private readonly appStore = inject(AppStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly editando = signal(false);
  readonly salvando = signal(false);
  readonly possuiExecucoes = signal(false);
  readonly gerandoIA = signal(false);
  readonly sugestaoIA = signal<ChecklistGeradoIA | null>(null);

  descricaoIA = '';
  private templateId?: number;

  readonly normas = [
    { valor: TipoNorma.ANVISA, label: 'ANVISA' },
    { valor: TipoNorma.ISO_9001, label: 'ISO 9001 — Qualidade' },
    { valor: TipoNorma.ISO_22000, label: 'ISO 22000 — Segurança Alimentar' },
    { valor: TipoNorma.MAPA, label: 'MAPA' },
    { valor: TipoNorma.VIGILANCIA_SANITARIA, label: 'Vigilância Sanitária' },
    { valor: TipoNorma.ISO_45001, label: 'ISO 45001 — Segurança Trabalhista' },
    { valor: TipoNorma.ISO_14001, label: 'ISO 14001 — Ambiental' },
    { valor: TipoNorma.SEM_NORMA, label: 'Sem Norma' },
  ];

  readonly exemplosPromptIA = [
    {
      titulo: 'Sanitária',
      icone: 'restaurant',
      prompt: 'Checklist para auditoria sanitária em cozinha industrial, com foco em higiene, armazenamento, validade e rastreabilidade.',
    },
    {
      titulo: 'ISO 9001',
      icone: 'verified',
      prompt: 'Checklist ISO 9001 para processo de atendimento ao cliente, cobrindo registros, indicadores, tratativas e melhoria contínua.',
    },
    {
      titulo: 'Segurança',
      icone: 'health_and_safety',
      prompt: 'Checklist de segurança do trabalho para inspeção de equipamentos elétricos, EPIs, sinalização e procedimentos de bloqueio.',
    },
  ];

  readonly form = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    tipoNorma: ['', Validators.required],
    descricao: [''],
    itens: this.fb.array([]),
  });

  get itens(): FormArray { return this.form.get('itens') as FormArray; }

  getItemGroup(i: number): FormGroup {
    return this.itens.at(i) as FormGroup;
  }

  promptIAValido(): boolean {
    return this.descricaoIA.trim().length >= 10;
  }

  usarExemploPromptIA(prompt: string): void {
    this.descricaoIA = prompt;
  }

  totalItensIA(): number {
    return this.sugestaoIA()?.itens.length ?? 0;
  }

  normaLabel(tipoNorma: string): string {
    return this.normas.find(norma => norma.valor === tipoNorma)?.label ?? tipoNorma;
  }

  gruposIA(): { nome: string; itens: ChecklistGeradoIA['itens'] }[] {
    const sugestao = this.sugestaoIA();
    if (!sugestao) return [];
    const map = new Map<string, ChecklistGeradoIA['itens']>();
    for (const item of sugestao.itens) {
      const lista = map.get(item.grupo) ?? [];
      lista.push(item);
      map.set(item.grupo, lista);
    }
    return Array.from(map.entries()).map(([nome, itens]) => ({ nome, itens }));
  }

  ngOnInit(): void {
    this.templateId = this.route.snapshot.params['id'];
    if (this.templateId) {
      this.editando.set(true);
      this.templateService.buscar(this.templateId).subscribe(t => {
        this.form.patchValue({ titulo: t.titulo, tipoNorma: t.tipoNorma, descricao: t.descricao });
        t.itens
          ?.sort((a, b) => a.ordem - b.ordem)
          .forEach(item => this.adicionarItemExistente(item.grupo, item.descricao));
      });
    } else {
      this.adicionarItem();
    }
  }

  adicionarItem(): void {
    this.itens.push(
      this.fb.group({
        grupo: [''],
        descricao: ['', Validators.required],
      }),
    );
  }

  adicionarItemExistente(grupo: string, descricao: string): void {
    this.itens.push(
      this.fb.group({ grupo: [grupo], descricao: [descricao, Validators.required] }),
    );
  }

  removerItem(i: number): void {
    this.itens.removeAt(i);
  }

  reordenar(event: CdkDragDrop<FormGroup[]>): void {
    const controles = this.itens.controls;
    moveItemInArray(controles, event.previousIndex, event.currentIndex);
    (this.form as FormGroup).setControl('itens', this.fb.array(controles));
  }

  abrirSidenavIA(): void {
    this.descricaoIA = '';
    this.sugestaoIA.set(null);
    this.sidenavIA.open();
  }

  fecharSidenavIA(): void {
    this.sidenavIA.close();
  }

  gerarComIA(): void {
    if (!this.promptIAValido()) return;
    this.gerandoIA.set(true);
    this.sugestaoIA.set(null);
    this.iaService.gerarChecklist(this.descricaoIA.trim()).subscribe({
      next: (resultado) => {
        this.sugestaoIA.set(resultado);
        this.gerandoIA.set(false);
      },
      error: () => {
        this.gerandoIA.set(false);
        this.appStore.erro('Não foi possível gerar o checklist. Tente novamente.');
      },
    });
  }

  aplicarSugestaoIA(): void {
    const sugestao = this.sugestaoIA();
    if (!sugestao) return;

    this.form.patchValue({
      titulo: sugestao.titulo,
      tipoNorma: sugestao.tipoNorma,
      descricao: sugestao.descricao,
    });

    while (this.itens.length > 0) {
      this.itens.removeAt(0);
    }

    sugestao.itens
      .sort((a, b) => a.ordem - b.ordem)
      .forEach(item => this.adicionarItemExistente(item.grupo, item.descricao));

    this.sidenavIA.close();
  }

  salvar(): void {
    if (this.form.invalid || this.itens.length === 0) return;
    this.salvando.set(true);

    const raw = this.form.value;
    const dto = {
      titulo: raw.titulo!,
      tipoNorma: raw.tipoNorma as any,
      descricao: raw.descricao ?? undefined,
      itens: (raw.itens as any[]).map((item, i) => ({
        grupo: item.grupo ?? '',
        descricao: item.descricao,
        ordem: i,
      })),
    };

    const req = this.editando()
      ? this.templateService.atualizar(this.templateId!, dto)
      : this.templateService.criar(dto);

    req.subscribe({
      next: () => {
        this.appStore.sucesso(
          this.editando() ? 'Template atualizado.' : 'Template criado.',
        );
        this.router.navigate(['/checklist-templates']);
      },
      error: () => this.salvando.set(false),
    });
  }
}

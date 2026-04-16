import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  FormBuilder, Validators, ReactiveFormsModule,
  FormArray, FormGroup,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChecklistTemplateService } from '../../../core/services/checklist-template.service';
import { AppStore } from '../../../store/app.store';
import { TipoNorma } from '../../../core/models/enums';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, DragDropModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatIconModule, MatDividerModule, MatTooltipModule,
    PageHeaderComponent,
  ],
  template: `
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
          <button
            mat-stroked-button
            type="button"
            (click)="adicionarItem()"
            [disabled]="editando() && possuiExecucoes()"
          >
            <mat-icon>add</mat-icon> Adicionar item
          </button>
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
  `,
})
export class TemplateFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly templateService = inject(ChecklistTemplateService);
  private readonly appStore = inject(AppStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly editando = signal(false);
  readonly salvando = signal(false);
  readonly possuiExecucoes = signal(false);
  private templateId?: number;

  readonly normas = [
    { valor: TipoNorma.ANVISA, label: 'ANVISA' },
    { valor: TipoNorma.ISO_9001, label: 'ISO 9001 — Qualidade' },
    { valor: TipoNorma.ISO_22000, label: 'ISO 22000 — Segurança Alimentar' },
    { valor: TipoNorma.MAPA, label: 'MAPA' },
    { valor: TipoNorma.VIGILANCIA_SANITARIA, label: 'Vigilância Sanitária' },
    { valor: TipoNorma.ISO_45001, label: 'ISO 45001 — Segurança Trabalhista' },
    { valor: TipoNorma.ISO_14001, label: 'ISO 14001 — Ambiental' },
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
      // Começa com 1 item vazio
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

  private adicionarItemExistente(grupo: string, descricao: string): void {
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
    // Força redetecção de mudanças no FormArray
    (this.form as FormGroup).setControl('itens', this.fb.array(controles));
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

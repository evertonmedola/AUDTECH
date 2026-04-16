import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ChecklistExecucaoService } from '../../../core/services/checklist-execucao.service';
import { ChecklistTemplateService } from '../../../core/services/checklist-template.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AppStore } from '../../../store/app.store';
import { ChecklistTemplate } from '../../../core/models/checklist.model';
import { Usuario } from '../../../core/models/usuario.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';

@Component({
  selector: 'app-execucao-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    PageHeaderComponent, StatusLabelPipe,
  ],
  template: `
    <app-page-header
      titulo="Nova Auditoria"
      [breadcrumb]="[{ label: 'Auditorias', url: '/checklist-execucoes' }, { label: 'Nova' }]"
    />

    <div class="max-w-2xl">
      <form [formGroup]="form" (ngSubmit)="salvar()" class="flex flex-col gap-4">

        <mat-form-field appearance="outline">
          <mat-label>Template de checklist *</mat-label>
          <mat-select formControlName="templateId">
            @for (t of templates(); track t.id) {
              <mat-option [value]="t.id">
                {{ t.titulo }} — {{ t.tipoNorma | statusLabel }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Auditor responsável *</mat-label>
          <mat-select formControlName="auditorId">
            @for (a of auditores(); track a.id) {
              <mat-option [value]="a.id">{{ a.nome }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Prazo para conclusão</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="prazo" [min]="hoje" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>

        <div class="flex gap-3 mt-2">
          <button mat-stroked-button type="button" routerLink="/checklist-execucoes">Cancelar</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || salvando()">
            @if (salvando()) { Criando... } @else { Criar auditoria }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ExecucaoFormComponent implements OnInit {
  private readonly fb              = inject(FormBuilder);
  private readonly execucaoService = inject(ChecklistExecucaoService);
  private readonly templateService = inject(ChecklistTemplateService);
  private readonly usuarioService  = inject(UsuarioService);
  private readonly appStore        = inject(AppStore);
  private readonly router          = inject(Router);

  readonly templates = signal<ChecklistTemplate[]>([]);
  readonly auditores = signal<Usuario[]>([]);
  readonly salvando  = signal(false);
  readonly hoje      = new Date();

  readonly form = this.fb.group({
    templateId: [null as number | null, Validators.required],
    auditorId:  [null as number | null, Validators.required],
    prazo:      [null as Date | null],
  });

  ngOnInit(): void {
    this.templateService.listarAtivos().subscribe(lista => this.templates.set(lista));
    this.usuarioService.auditoresAtivos().subscribe(lista => this.auditores.set(lista));
  }

  salvar(): void {
    if (this.form.invalid) return;
    this.salvando.set(true);

    const raw = this.form.value;
    const prazo = raw.prazo
      ? (raw.prazo as Date).toISOString().split('T')[0]
      : undefined;

    this.execucaoService.criar({
      templateId: raw.templateId!,
      auditorId:  raw.auditorId!,
      prazo,
    }).subscribe({
      next: (exec) => {
        this.appStore.sucesso('Auditoria criada com sucesso.');
        this.router.navigate(['/checklist-execucoes', exec.id]);
      },
      error: () => this.salvando.set(false),
    });
  }
}

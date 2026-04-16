import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { EmpresaService } from '../../../core/services/empresa.service';
import { AppStore } from '../../../store/app.store';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const TIPOS_EMPRESA = [
  'Indústria de Alimentos', 'Farmacêutica', 'Agroindústria',
  'Serviços de Saúde', 'Frigorífico', 'Laticínio',
  'Restaurante', 'Farmácia', 'Clínica', 'Outro',
];

@Component({
  selector: 'app-empresa-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatDividerModule, PageHeaderComponent,
  ],
  template: `
    <app-page-header
      [titulo]="editando() ? 'Editar Empresa' : 'Nova Empresa'"
      [breadcrumb]="[{ label: 'Empresas', url: '/empresas' }, { label: editando() ? 'Editar' : 'Nova' }]"
    />

    <div class="max-w-2xl">
      <form [formGroup]="form" (ngSubmit)="salvar()" class="flex flex-col gap-4">

        <!-- Dados da empresa -->
        <mat-form-field appearance="outline">
          <mat-label>Razão Social *</mat-label>
          <input matInput formControlName="razaoSocial" />
          @if (form.get('razaoSocial')?.hasError('required') && form.get('razaoSocial')?.touched) {
            <mat-error>Razão social é obrigatória</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nome Fantasia</mat-label>
          <input matInput formControlName="nomeFantasia" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo de Empresa *</mat-label>
          <mat-select formControlName="tipoEmpresa">
            @for (tipo of tipos; track tipo) {
              <mat-option [value]="tipo">{{ tipo }}</mat-option>
            }
          </mat-select>
          @if (form.get('tipoEmpresa')?.hasError('required') && form.get('tipoEmpresa')?.touched) {
            <mat-error>Selecione o tipo da empresa</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>CNPJ *</mat-label>
          <input matInput formControlName="cnpj" placeholder="00.000.000/0000-00"
            (input)="mascaraCnpj($event)" maxlength="18" />
          @if (form.get('cnpj')?.hasError('required') && form.get('cnpj')?.touched) {
            <mat-error>CNPJ é obrigatório</mat-error>
          }
          @if (form.get('cnpj')?.hasError('pattern')) {
            <mat-error>CNPJ inválido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Telefone</mat-label>
          <input matInput formControlName="telefone" placeholder="(00) 00000-0000" />
        </mat-form-field>

        <!-- Seção Admin — apenas na criação -->
        @if (!editando()) {
          <mat-divider class="my-2" />

          <div>
            <h2 class="text-base font-medium text-gray-700 mb-1">Administrador da Empresa</h2>
            <p class="text-sm text-gray-400 mb-4">
              Este usuário será o administrador responsável pela empresa.
            </p>
          </div>

          <div formGroupName="admin" class="flex flex-col gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Nome completo *</mat-label>
              <input matInput formControlName="nome" />
              @if (admin.get('nome')?.hasError('required') && admin.get('nome')?.touched) {
                <mat-error>Nome é obrigatório</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>CPF *</mat-label>
              <input matInput formControlName="cpf" placeholder="000.000.000-00"
                (input)="mascaraCpf($event)" maxlength="14" />
              @if (admin.get('cpf')?.hasError('required') && admin.get('cpf')?.touched) {
                <mat-error>CPF é obrigatório</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>E-mail *</mat-label>
              <input matInput formControlName="email" type="email" />
              @if (admin.get('email')?.hasError('required') && admin.get('email')?.touched) {
                <mat-error>E-mail é obrigatório</mat-error>
              }
              @if (admin.get('email')?.hasError('email')) {
                <mat-error>Informe um e-mail válido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Senha *</mat-label>
              <input matInput formControlName="senha" type="password" />
              <mat-hint>Mínimo 8 caracteres, com maiúscula, minúscula e número</mat-hint>
              @if (admin.get('senha')?.hasError('required') && admin.get('senha')?.touched) {
                <mat-error>Senha é obrigatória</mat-error>
              }
              @if (admin.get('senha')?.hasError('minlength')) {
                <mat-error>Mínimo 8 caracteres</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Telefone</mat-label>
              <input matInput formControlName="telefone" placeholder="(00) 00000-0000" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Cargo</mat-label>
              <input matInput formControlName="cargo" />
            </mat-form-field>
          </div>
        }

        <!-- Ações -->
        <div class="flex gap-3 mt-2">
          <button mat-stroked-button type="button" routerLink="/empresas">Cancelar</button>
          <button mat-flat-button color="primary" type="submit"
            [disabled]="form.invalid || salvando()">
            @if (salvando()) { Salvando... } @else { Salvar }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class EmpresaFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly empresaService = inject(EmpresaService);
  private readonly appStore = inject(AppStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly tipos = TIPOS_EMPRESA;
  readonly editando = signal(false);
  readonly salvando = signal(false);
  private empresaId?: number;

  // Troca a declaração atual do form por essa:
  readonly form: FormGroup = this.fb.group({
    razaoSocial: ['', [Validators.required, Validators.maxLength(200)]],
    nomeFantasia: [''],
    tipoEmpresa: ['', Validators.required],
    cnpj: ['', [Validators.required, Validators.pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)]],
    telefone: [''],
    admin: this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(150)]],
      cpf: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)]],
      telefone: [''],
      cargo: [''],
    }),
  });

  get admin(): FormGroup {
    return this.form.get('admin') as FormGroup;
  }

  ngOnInit(): void {
    this.empresaId = this.route.snapshot.params['id'];
    if (this.empresaId) {
      this.editando.set(true);
      // Remove validators do admin ao editar
      this.form.removeControl('admin');
      this.empresaService.buscar(this.empresaId).subscribe(empresa => {
        const cnpj = empresa.cnpj.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          '$1.$2.$3/$4-$5',
        );
        this.form.patchValue({ ...empresa, cnpj });
      });
    }
  }

  mascaraCnpj(e: Event): void {
    let v = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 14);
    v = v.replace(/(\d{2})(\d)/, '$1.$2');
    v = v.replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
    this.form.get('cnpj')!.setValue(v, { emitEvent: false });
  }

  mascaraCpf(e: Event): void {
    let v = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/(\d{3})-?(\d{2})$/, '$1-$2');
    this.form.get('admin')?.get('cpf')!.setValue(v, { emitEvent: false });
  }

  salvar(): void {
    if (this.form.invalid) return;
    this.salvando.set(true);

    const raw = this.form.value as any;

    if (this.editando()) {
      const dto = {
        ...raw,
        cnpj: raw.cnpj.replace(/\D/g, ''),
      };
      this.empresaService.atualizar(this.empresaId!, dto).subscribe({
        next: () => {
          this.appStore.sucesso('Empresa atualizada.');
          this.router.navigate(['/empresas']);
        },
        error: () => this.salvando.set(false),
      });
    } else {
      const dto = {
        razaoSocial: raw.razaoSocial,
        nomeFantasia: raw.nomeFantasia,
        tipoEmpresa: raw.tipoEmpresa,
        cnpj: raw.cnpj.replace(/\D/g, ''),
        telefone: raw.telefone,
        admin: {
          ...raw.admin,
          cpf: raw.admin.cpf.replace(/\D/g, ''),
        },
      };
      this.empresaService.criarComAdmin(dto).subscribe({
        next: () => {
          this.appStore.sucesso('Empresa e administrador cadastrados com sucesso.');
          this.router.navigate(['/empresas']);
        },
        error: () => this.salvando.set(false),
      });
    }
  }
}
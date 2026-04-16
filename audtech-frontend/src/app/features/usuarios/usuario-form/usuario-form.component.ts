import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AppStore } from '../../../store/app.store';
import { PerfilUsuario } from '../../../core/models/enums';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { AuthStore } from '@store/auth.store';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatIconModule, PageHeaderComponent,
  ],
  template: `
    <app-page-header
      [titulo]="editando() ? 'Editar Usuário' : 'Novo Usuário'"
      [breadcrumb]="[{ label: 'Usuários', url: '/usuarios' }, { label: editando() ? 'Editar' : 'Novo' }]"
    />

    <div class="max-w-2xl">
      <form [formGroup]="form" (ngSubmit)="salvar()" class="flex flex-col gap-4">

        <!-- Perfil -->
        <mat-form-field appearance="outline">
          <mat-label>Perfil *</mat-label>
          <mat-select formControlName="perfil" [disabled]="editando()">
            <mat-option value="AUDITOR">Auditor</mat-option>
            <mat-option value="RAC">Responsável pelas Ações Corretivas</mat-option>
            <mat-option value="ADMIN">Administrador</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Dados comuns -->
        <mat-form-field appearance="outline">
          <mat-label>Nome completo *</mat-label>
          <input matInput formControlName="nome" />
          @if (form.get('nome')?.hasError('required') && form.get('nome')?.touched) {
            <mat-error>Nome é obrigatório</mat-error>
          }
          @if (form.get('nome')?.hasError('minlength')) {
            <mat-error>Nome deve ter no mínimo 4 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>CPF *</mat-label>
          <input matInput formControlName="cpf" placeholder="000.000.000-00"
            (input)="mascaraCpf($event)" maxlength="14" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>E-mail *</mat-label>
          <input matInput formControlName="email" type="email" />
        </mat-form-field>

        @if (!editando()) {
          <mat-form-field appearance="outline">
            <mat-label>Senha *</mat-label>
            <input matInput formControlName="senha" type="password" />
            <mat-hint>Mínimo 8 caracteres, com maiúscula, minúscula e número</mat-hint>
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Telefone</mat-label>
          <input matInput formControlName="telefone" placeholder="(00) 00000-0000" />
        </mat-form-field>

        <!-- Campo exclusivo de Admin -->
        @if (perfil() === 'ADMIN') {
          <mat-form-field appearance="outline">
            <mat-label>Cargo *</mat-label>
            <input matInput formControlName="cargo" />
          </mat-form-field>
        }

        <!-- Campo exclusivo de RAC -->
        @if (perfil() === 'RAC') {
          <mat-form-field appearance="outline">
            <mat-label>Departamento / Setor</mat-label>
            <input matInput formControlName="departamento" />
          </mat-form-field>
        }

        <div class="flex gap-3 mt-2">
          <button mat-stroked-button type="button" routerLink="/usuarios">Cancelar</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || salvando()">
            @if (salvando()) { Salvando... } @else { Salvar }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class UsuarioFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly appStore = inject(AppStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authStore = inject(AuthStore);

  readonly editando = signal(false);
  readonly salvando = signal(false);
  private usuarioId?: number;

  readonly form = this.fb.group({
    perfil: ['AUDITOR', Validators.required],
    nome: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(150)]],
    cpf: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    senha: [''],
    telefone: [''],
    cargo: [''],
    departamento: [''],
  });

  readonly perfil = signal<string>('AUDITOR');

  ngOnInit(): void {
    this.usuarioId = this.route.snapshot.params['id'];
    if (this.usuarioId) {
      this.editando.set(true);
      this.usuarioService.buscar(this.usuarioId).subscribe(u => {
        const cpf = u.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        this.form.patchValue({ ...u, cpf, senha: '' });
      });
    } else {
      this.form.get('senha')!.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
      ]);
    }

    // Adiciona isso:
    this.form.get('perfil')!.valueChanges.subscribe(v => {
      this.perfil.set(v ?? '');
      if (v !== 'ADMIN') this.form.get('cargo')!.setValue('');
      if (v !== 'RAC') this.form.get('departamento')!.setValue('');
    });
  }

  mascaraCpf(e: Event): void {
    let v = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/(\d{3})-?(\d{2})$/, '$1-$2');
    this.form.get('cpf')!.setValue(v, { emitEvent: false });
  }

  salvar(): void {
    if (this.form.invalid) return;
    this.salvando.set(true);

    const raw = this.form.value as any;
    const dto = {
      ...raw,
      cpf: raw.cpf.replace(/\D/g, ''),
      empresaId: this.authStore.empresaId(),
    };
    if (this.editando()) delete dto.senha;

    const req = this.editando()
      ? this.usuarioService.atualizar(this.usuarioId!, dto)
      : this.usuarioService.criar(dto);

    req.subscribe({
      next: () => {
        this.appStore.sucesso(this.editando() ? 'Usuário atualizado.' : 'Usuário cadastrado.');
        this.router.navigate(['/usuarios']);
      },
      error: () => this.salvando.set(false),
    });
  }
}

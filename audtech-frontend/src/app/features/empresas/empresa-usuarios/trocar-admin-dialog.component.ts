import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-trocar-admin-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Trocar Administrador</h2>

    <mat-dialog-content>
      <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 mb-4">
        <mat-icon class="text-amber-500 align-middle mr-1" style="font-size:16px;width:16px;height:16px">warning</mat-icon>
        O administrador atual será inativado e substituído pelo novo.
      </div>

      <form [formGroup]="form" class="flex flex-col gap-4 pt-1">
        <mat-form-field appearance="outline">
          <mat-label>Nome completo *</mat-label>
          <input matInput formControlName="nome" />
          @if (form.get('nome')?.hasError('required') && form.get('nome')?.touched) {
            <mat-error>Nome é obrigatório</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>CPF *</mat-label>
          <input matInput formControlName="cpf" placeholder="000.000.000-00"
            (input)="mascaraCpf($event)" maxlength="14" />
          @if (form.get('cpf')?.hasError('required') && form.get('cpf')?.touched) {
            <mat-error>CPF é obrigatório</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>E-mail *</mat-label>
          <input matInput formControlName="email" type="email" />
          @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
            <mat-error>E-mail é obrigatório</mat-error>
          }
          @if (form.get('email')?.hasError('email')) {
            <mat-error>Informe um e-mail válido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nova senha *</mat-label>
          <input matInput formControlName="senha"
            [type]="mostrarSenha() ? 'text' : 'password'" />
          <button mat-icon-button matSuffix type="button"
            (click)="mostrarSenha.set(!mostrarSenha())">
            <mat-icon>{{ mostrarSenha() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-hint>Mínimo 8 caracteres, com maiúscula, minúscula e número</mat-hint>
          @if (form.get('senha')?.hasError('required') && form.get('senha')?.touched) {
            <mat-error>Senha é obrigatória</mat-error>
          }
          @if (form.get('senha')?.hasError('minlength')) {
            <mat-error>Mínimo 8 caracteres</mat-error>
          }
          @if (form.get('senha')?.hasError('pattern')) {
            <mat-error>Deve conter maiúscula, minúscula e número</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cargo</mat-label>
          <input matInput formControlName="cargo" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Telefone</mat-label>
          <input matInput formControlName="telefone" placeholder="(00) 00000-0000" />
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="warn"
        [disabled]="form.invalid"
        (click)="confirmar()">
        Trocar administrador
      </button>
    </mat-dialog-actions>
  `,
})
export class TrocarAdminDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TrocarAdminDialogComponent>);

  readonly mostrarSenha = signal(false);

  readonly form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(4)]],
    cpf: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    ]],
    cargo: [''],
    telefone: [''],
  });

  mascaraCpf(e: Event): void {
    let v = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/(\d{3})-?(\d{2})$/, '$1-$2');
    this.form.get('cpf')!.setValue(v, { emitEvent: false });
  }

  confirmar(): void {
    if (this.form.invalid) return;
    const raw = this.form.value as any;
    this.dialogRef.close({
      ...raw,
      cpf: raw.cpf.replace(/\D/g, ''),
    });
  }
}
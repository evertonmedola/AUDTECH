import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { signal } from '@angular/core';

@Component({
  selector: 'app-resetar-senha-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Redefinir Senha</h2>

    <mat-dialog-content>
      <p class="text-sm text-gray-500 mb-4">
        Defina uma nova senha para este administrador.
      </p>

      <form [formGroup]="form" class="flex flex-col gap-4 pt-1">
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
          <mat-label>Confirmar senha *</mat-label>
          <input matInput formControlName="confirmar"
            [type]="mostrarSenha() ? 'text' : 'password'" />
          @if (form.hasError('senhaNaoBate') && form.get('confirmar')?.touched) {
            <mat-error>As senhas não coincidem</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary"
        [disabled]="form.invalid"
        (click)="confirmar()">
        Redefinir senha
      </button>
    </mat-dialog-actions>
  `,
})
export class ResetarSenhaDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ResetarSenhaDialogComponent>);

  readonly mostrarSenha = signal(false);

  readonly form = this.fb.group({
    senha: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    ]],
    confirmar: ['', Validators.required],
  }, { validators: this.senhasIguais });

  private senhasIguais(group: any) {
    const senha = group.get('senha')?.value;
    const confirmar = group.get('confirmar')?.value;
    return senha === confirmar ? null : { senhaNaoBate: true };
  }

  confirmar(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value.senha);
  }
}
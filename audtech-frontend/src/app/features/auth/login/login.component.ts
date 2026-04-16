import {
  Component, inject, signal, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../store/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        <!-- Logo -->
        <div class="flex flex-col items-center mb-8">
          <div class="w-14 h-14 bg-indigo-700 rounded-2xl flex items-center justify-center mb-4">
            <mat-icon class="text-white" style="font-size:32px;width:32px;height:32px">verified</mat-icon>
          </div>
          <h1 class="text-2xl font-medium text-gray-800">AUDTECH</h1>
          <p class="text-sm text-gray-400 mt-1">Sistema de Auditoria Interna</p>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="entrar()" class="flex flex-col gap-4">
          <mat-form-field appearance="outline">
            <mat-label>E-mail</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            <mat-icon matSuffix>email</mat-icon>
            @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
              <mat-error>E-mail é obrigatório</mat-error>
            }
            @if (form.get('email')?.hasError('email')) {
              <mat-error>Informe um e-mail válido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Senha</mat-label>
            <input
              matInput
              [type]="mostrarSenha() ? 'text' : 'password'"
              formControlName="senha"
              autocomplete="current-password"
            />
            <button
              matSuffix
              mat-icon-button
              type="button"
              (click)="mostrarSenha.set(!mostrarSenha())"
            >
              <mat-icon>{{ mostrarSenha() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('senha')?.hasError('required') && form.get('senha')?.touched) {
              <mat-error>Senha é obrigatória</mat-error>
            }
          </mat-form-field>

          @if (erroLogin()) {
            <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {{ erroLogin() }}
            </div>
          }

          <button
            mat-flat-button
            color="primary"
            type="submit"
            class="h-12 text-base"
            [disabled]="carregando() || form.invalid"
          >
            @if (carregando()) {
              <mat-spinner diameter="20" class="inline-block mr-2" />
              Entrando...
            } @else {
              Entrar
            }
          </button>
        </form>

        <p class="text-center text-xs text-gray-400 mt-6">
          Acesso restrito a usuários cadastrados pela empresa
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });

  readonly carregando = signal(false);
  readonly erroLogin = signal('');
  readonly mostrarSenha = signal(false);

  ngOnInit(): void {
    if (this.authStore.autenticado()) {
      const destino = this.authStore.isSuperAdmin() ? '/empresas' : '/dashboard';
      this.router.navigate([destino]);
    }
  }

  entrar(): void {
    if (this.form.invalid) return;
    this.carregando.set(true);
    this.erroLogin.set('');

    const { email, senha } = this.form.value;

    this.authService.login({ email: email!, senha: senha! }).subscribe({
      next: () => {
        const destino = this.authStore.isSuperAdmin() ? '/empresas' : '/dashboard';
        this.router.navigate([destino]);
      },
      error: (err) => {
        this.erroLogin.set(
          err.error?.message ?? 'E-mail ou senha incorretos.',
        );
        this.carregando.set(false);
      },
    });
  }

}

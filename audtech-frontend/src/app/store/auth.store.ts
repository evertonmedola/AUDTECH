import { Injectable, signal, computed } from '@angular/core';
import { PerfilUsuario } from '../core/models/enums';

export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  empresaId: number | null;
  nomeEmpresa: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _token = signal<string | null>(this.lerToken());
  private readonly _usuario = signal<UsuarioLogado | null>(this.lerUsuario());

  readonly token = this._token.asReadonly();
  readonly usuario = this._usuario.asReadonly();

  readonly autenticado = computed(() => !!this._token());
  readonly perfil = computed(() => this._usuario()?.perfil ?? null);
  readonly isAdmin = computed(() => this._usuario()?.perfil === PerfilUsuario.ADMIN);
  readonly isAuditor = computed(() => this._usuario()?.perfil === PerfilUsuario.AUDITOR);
  readonly isRac = computed(() => this._usuario()?.perfil === PerfilUsuario.RAC);
  readonly isSuperAdmin = computed(() => this._usuario()?.perfil === PerfilUsuario.SUPERADMIN);
  readonly empresaId = computed(() => this._usuario()?.empresaId ?? null);

  login(token: string, usuario: UsuarioLogado): void {
    localStorage.setItem('audtech_token', token);
    localStorage.setItem('audtech_usuario', JSON.stringify(usuario));
    this._token.set(token);
    this._usuario.set(usuario);
  }

  logout(): void {
    localStorage.removeItem('audtech_token');
    localStorage.removeItem('audtech_usuario');
    this._token.set(null);
    this._usuario.set(null);
  }

  private lerToken(): string | null {
    return localStorage.getItem('audtech_token');
  }

  private lerUsuario(): UsuarioLogado | null {
    const raw = localStorage.getItem('audtech_usuario');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UsuarioLogado;
    } catch {
      return null;
    }
  }
}
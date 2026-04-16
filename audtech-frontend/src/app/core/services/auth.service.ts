import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthStore } from '../../store/auth.store';
import { LoginResponse, Usuario } from '../models/usuario.model';

interface LoginDto {
  email: string;
  senha: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http      = inject(HttpClient);
  private readonly router    = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly base      = `${environment.apiUrl}/auth`;

  login(dto: LoginDto): Observable<{ sucesso: boolean; dados: LoginResponse }> {
    return this.http
      .post<{ sucesso: boolean; dados: LoginResponse }>(`${this.base}/login`, dto)
      .pipe(
        tap(({ dados }) => {
          this.authStore.login(dados.accessToken, {
            id:          dados.usuario.id,
            nome:        dados.usuario.nome,
            email:       dados.usuario.email,
            perfil:      dados.usuario.perfil,
            empresaId:   dados.usuario.empresaId,
            nomeEmpresa: dados.usuario.nomeEmpresa,
          });
        }),
      );
  }

  logout(): void {
    this.authStore.logout();
    this.router.navigate(['/auth/login']);
  }

  perfil(): Observable<{ sucesso: boolean; dados: Usuario }> {
    return this.http.get<{ sucesso: boolean; dados: Usuario }>(`${this.base}/me`);
  }
}

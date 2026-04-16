import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../models/usuario.model';
import { PerfilUsuario } from '../models/enums';

type ApiResp<T> = { sucesso: boolean; dados: T };

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuarios`;

  listar(perfil?: PerfilUsuario): Observable<Usuario[]> {
    let params = new HttpParams();
    if (perfil) params = params.set('perfil', perfil);
    return this.http
      .get<ApiResp<Usuario[]>>(this.base, { params })
      .pipe(map(r => r.dados));
  }

  buscar(id: number): Observable<Usuario> {
    return this.http
      .get<ApiResp<Usuario>>(`${this.base}/${id}`)
      .pipe(map(r => r.dados));
  }

  criar(dto: CreateUsuarioDto): Observable<Usuario> {
    return this.http
      .post<ApiResp<Usuario>>(this.base, dto)
      .pipe(map(r => r.dados));
  }

  atualizar(id: number, dto: UpdateUsuarioDto): Observable<Usuario> {
    return this.http
      .patch<ApiResp<Usuario>>(`${this.base}/${id}`, dto)
      .pipe(map(r => r.dados));
  }

  auditoresAtivos(): Observable<Usuario[]> {
    return this.http
      .get<ApiResp<Usuario[]>>(`${this.base}/auditores-ativos`)
      .pipe(map(r => r.dados));
  }

  racsAtivos(): Observable<Usuario[]> {
    return this.http
      .get<ApiResp<Usuario[]>>(`${this.base}/racs-ativos`)
      .pipe(map(r => r.dados));
  }

  listarPorEmpresa(empresaId: number, perfil?: PerfilUsuario): Observable<Usuario[]> {
    let params = new HttpParams();
    if (perfil) params = params.set('perfil', perfil);
    return this.http
      .get<ApiResp<Usuario[]>>(`${this.base}/empresa/${empresaId}`, { params })
      .pipe(map(r => r.dados));
  }

  resetarSenha(id: number, senha: string): Observable<{ mensagem: string }> {
    return this.http
      .patch<ApiResp<{ mensagem: string }>>(`${this.base}/${id}/resetar-senha`, { senha })
      .pipe(map(r => r.dados));
  }

  trocarAdmin(empresaId: number, dto: any): Observable<Usuario> {
    return this.http
      .patch<ApiResp<Usuario>>(`${this.base}/empresa/${empresaId}/trocar-admin`, dto)
      .pipe(map(r => r.dados));
  }
}

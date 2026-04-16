import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Empresa, CreateEmpresaDto, UpdateEmpresaDto } from '../models/usuario.model';

type ApiResp<T> = { sucesso: boolean; dados: T };

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/empresas`;

  listar(): Observable<Empresa[]> {
    return this.http
      .get<ApiResp<Empresa[]>>(this.base)
      .pipe(map(r => r.dados));
  }

  buscar(id: number): Observable<Empresa> {
    return this.http
      .get<ApiResp<Empresa>>(`${this.base}/${id}`)
      .pipe(map(r => r.dados));
  }

  criar(dto: CreateEmpresaDto): Observable<Empresa> {
    return this.http
      .post<ApiResp<Empresa>>(this.base, dto)
      .pipe(map(r => r.dados));
  }

  atualizar(id: number, dto: UpdateEmpresaDto): Observable<Empresa> {
    return this.http
      .patch<ApiResp<Empresa>>(`${this.base}/${id}`, dto)
      .pipe(map(r => r.dados));
  }

  inativar(id: number): Observable<{ mensagem: string }> {
    return this.http
      .delete<ApiResp<{ mensagem: string }>>(`${this.base}/${id}`)
      .pipe(map(r => r.dados));
  }

  criarComAdmin(dto: any): Observable<{ empresa: Empresa; admin: any }> {
    return this.http
      .post<ApiResp<{ empresa: Empresa; admin: any }>>(`${this.base}/com-admin`, dto)
      .pipe(map(r => r.dados));
  }
}

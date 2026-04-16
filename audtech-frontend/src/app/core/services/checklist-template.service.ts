import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  ChecklistTemplate,
  CreateChecklistTemplateDto,
} from '../models/checklist.model';
import { Status } from '../models/enums';

type ApiResp<T> = { sucesso: boolean; dados: T };

@Injectable({ providedIn: 'root' })
export class ChecklistTemplateService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/checklist-templates`;

  listar(): Observable<ChecklistTemplate[]> {
    return this.http
      .get<ApiResp<ChecklistTemplate[]>>(this.base)
      .pipe(map(r => r.dados));
  }

  listarAtivos(): Observable<ChecklistTemplate[]> {
    return this.http
      .get<ApiResp<ChecklistTemplate[]>>(`${this.base}/ativos`)
      .pipe(map(r => r.dados));
  }

  buscar(id: number): Observable<ChecklistTemplate> {
    return this.http
      .get<ApiResp<ChecklistTemplate>>(`${this.base}/${id}`)
      .pipe(map(r => r.dados));
  }

  criar(dto: CreateChecklistTemplateDto): Observable<ChecklistTemplate> {
    return this.http
      .post<ApiResp<ChecklistTemplate>>(this.base, dto)
      .pipe(map(r => r.dados));
  }

  atualizar(id: number, dto: Partial<CreateChecklistTemplateDto> & { status?: Status }): Observable<ChecklistTemplate> {
    return this.http
      .patch<ApiResp<ChecklistTemplate>>(`${this.base}/${id}`, dto)
      .pipe(map(r => r.dados));
  }

  inativar(id: number): Observable<{ mensagem: string }> {
    return this.http
      .delete<ApiResp<{ mensagem: string }>>(`${this.base}/${id}`)
      .pipe(map(r => r.dados));
  }

  listarGlobais(): Observable<ChecklistTemplate[]> {
    return this.http
      .get<ApiResp<ChecklistTemplate[]>>(`${this.base}/global`)
      .pipe(map(r => r.dados));
  }

  criarGlobal(dto: CreateChecklistTemplateDto): Observable<ChecklistTemplate> {
    return this.http
      .post<ApiResp<ChecklistTemplate>>(`${this.base}/global`, dto)
      .pipe(map(r => r.dados));
  }

  atualizarGlobal(id: number, dto: Partial<CreateChecklistTemplateDto> & { status?: Status }): Observable<ChecklistTemplate> {
    return this.http
      .patch<ApiResp<ChecklistTemplate>>(`${this.base}/global/${id}`, dto)
      .pipe(map(r => r.dados));
  }

  inativarGlobal(id: number): Observable<{ mensagem: string }> {
    return this.http
      .delete<ApiResp<{ mensagem: string }>>(`${this.base}/global/${id}`)
      .pipe(map(r => r.dados));
  }
}

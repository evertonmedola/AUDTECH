import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  ChecklistExecucao,
  CreateExecucaoDto,
  UpdateItemExecucaoDto,
  CreatePendenciaDto,
  CreateNaoConformidadeDto,
  AssinarChecklistDto,
  Evidencia,
  Pendencia,
  NaoConformidade,
  ItemExecucao,
} from '../models/checklist.model';

type ApiResp<T> = { sucesso: boolean; dados: T };

@Injectable({ providedIn: 'root' })
export class ChecklistExecucaoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/checklist-execucoes`;

  listar(): Observable<ChecklistExecucao[]> {
    return this.http
      .get<ApiResp<ChecklistExecucao[]>>(this.base)
      .pipe(map(r => r.dados));
  }

  buscar(id: number): Observable<ChecklistExecucao> {
    return this.http
      .get<ApiResp<ChecklistExecucao>>(`${this.base}/${id}`)
      .pipe(map(r => r.dados));
  }

  criar(dto: CreateExecucaoDto): Observable<ChecklistExecucao> {
    return this.http
      .post<ApiResp<ChecklistExecucao>>(this.base, dto)
      .pipe(map(r => r.dados));
  }

  atualizarItem(
    execucaoId: number,
    itemId: number,
    dto: UpdateItemExecucaoDto,
  ): Observable<ItemExecucao> {
    return this.http
      .patch<ApiResp<ItemExecucao>>(
        `${this.base}/${execucaoId}/itens/${itemId}`,
        dto,
      )
      .pipe(map(r => r.dados));
  }

  adicionarEvidencia(
    execucaoId: number,
    itemId: number,
    arquivo: File,
  ): Observable<Evidencia> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.http
      .post<ApiResp<Evidencia>>(
        `${this.base}/${execucaoId}/itens/${itemId}/evidencias`,
        form,
      )
      .pipe(map(r => r.dados));
  }

  removerEvidencia(evidenciaId: number): Observable<{ mensagem: string }> {
    return this.http
      .delete<ApiResp<{ mensagem: string }>>(
        `${this.base}/evidencias/${evidenciaId}`,
      )
      .pipe(map(r => r.dados));
  }

  adicionarPendencia(
    execucaoId: number,
    itemId: number,
    dto: CreatePendenciaDto,
  ): Observable<Pendencia> {
    return this.http
      .post<ApiResp<Pendencia>>(
        `${this.base}/${execucaoId}/itens/${itemId}/pendencias`,
        dto,
      )
      .pipe(map(r => r.dados));
  }

  adicionarNaoConformidade(
    execucaoId: number,
    itemId: number,
    dto: CreateNaoConformidadeDto,
  ): Observable<NaoConformidade> {
    return this.http
      .post<ApiResp<NaoConformidade>>(
        `${this.base}/${execucaoId}/itens/${itemId}/nao-conformidades`,
        dto,
      )
      .pipe(map(r => r.dados));
  }

  assinar(id: number, dto: AssinarChecklistDto): Observable<ChecklistExecucao> {
    return this.http
      .post<ApiResp<ChecklistExecucao>>(`${this.base}/${id}/assinar`, dto)
      .pipe(map(r => r.dados));
  }
}
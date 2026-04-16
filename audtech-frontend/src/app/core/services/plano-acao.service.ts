import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  PlanoAcao,
  AcaoCorretiva,
  UpdateAcaoCorretivaDto,
  EvidenciaAcao,
} from '../models/plano-acao.model';

type ApiResp<T> = { sucesso: boolean; dados: T };

@Injectable({ providedIn: 'root' })
export class PlanoAcaoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/planos-acao`;

  listar(): Observable<PlanoAcao[]> {
    return this.http
      .get<ApiResp<PlanoAcao[]>>(this.base)
      .pipe(map(r => r.dados));
  }

  buscarPorExecucao(execucaoId: number): Observable<PlanoAcao> {
    return this.http
      .get<ApiResp<PlanoAcao>>(`${this.base}/execucao/${execucaoId}`)
      .pipe(map(r => r.dados));
  }

  atualizarAcao(
    acaoId: number,
    dto: UpdateAcaoCorretivaDto,
  ): Observable<AcaoCorretiva> {
    return this.http
      .patch<ApiResp<AcaoCorretiva>>(`${this.base}/acoes/${acaoId}`, dto)
      .pipe(map(r => r.dados));
  }

  adicionarEvidencia(
    acaoId: number,
    arquivo: File,
  ): Observable<EvidenciaAcao> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.http
      .post<ApiResp<EvidenciaAcao>>(
        `${this.base}/acoes/${acaoId}/evidencias`,
        form,
      )
      .pipe(map(r => r.dados));
  }
}

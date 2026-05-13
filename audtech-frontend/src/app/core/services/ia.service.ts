import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';

export interface ChecklistGeradoIA {
  titulo: string;
  tipoNorma: string;
  descricao: string;
  itens: { grupo: string; descricao: string; ordem: number }[];
}

type ApiResp<T> = { sucesso: boolean; dados: T };

@Injectable({ providedIn: 'root' })
export class IaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ia`;

  gerarChecklist(descricao: string): Observable<ChecklistGeradoIA> {
    return this.http
      .post<ApiResp<ChecklistGeradoIA>>(`${this.base}/gerar-checklist`, { descricao })
      .pipe(map(r => r.dados));
  }
}

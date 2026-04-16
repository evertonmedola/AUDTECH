import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';

type ApiResp<T> = { sucesso: boolean; dados: T };

export interface DashboardDados {
  statusChecklists?: { status: string; total: string }[];
  evolucaoMensal?: { mes: string; total: string }[];
  naoConformidadesPorCategoria?: { categoria: string; total: string }[];
  naoConformidadesPorCriticidade?: { criticidade: string; total: string }[];
  percentualPlanosAbertos?: {
    total: number;
    concluidos: number;
    percentualConcluido: number;
  };
  checklistsEmAtraso?: any[];
  acoesProximasVencimento?: any[];
  statusAcoes?: { status: string; total: string }[];
  acoesProximas?: any[];
}

export interface DashboardSuperAdminDados {
  totalEmpresas: number;
  empresasAtivas: number;
  empresasInativas: number;
  totalUsuarios: number;
  empresasComMaisAuditorias: { razaoSocial: string; total: string }[];
  auditoriasPorStatus: { status: string; total: string }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/dashboard`;

  getDados(): Observable<DashboardDados> {
    return this.http
      .get<ApiResp<DashboardDados>>(this.base)
      .pipe(map(r => r.dados));
  }

  getDadosSuperAdmin(): Observable<DashboardSuperAdminDados> {
    return this.http
      .get<ApiResp<DashboardSuperAdminDados>>(`${this.base}/superadmin`)
      .pipe(map(r => r.dados));
  }
}
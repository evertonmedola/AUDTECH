import { Injectable, signal, computed } from '@angular/core';

export interface Notificacao {
  id: string;
  mensagem: string;
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info';
}

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Injectable({ providedIn: 'root' })
export class AppStore {
  // ── Loading global ────────────────────────────────────────────────────────
  private readonly _loadingCount = signal(0);
  readonly loading = computed(() => this._loadingCount() > 0);

  iniciarLoading(): void  { this._loadingCount.update(n => n + 1); }
  finalizarLoading(): void {
    this._loadingCount.update(n => Math.max(0, n - 1));
  }

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  readonly breadcrumb = signal<BreadcrumbItem[]>([]);

  setBreadcrumb(itens: BreadcrumbItem[]): void {
    this.breadcrumb.set(itens);
  }

  // ── Notificações (toast) ──────────────────────────────────────────────────
  private readonly _notificacoes = signal<Notificacao[]>([]);
  readonly notificacoes = this._notificacoes.asReadonly();

  notificar(mensagem: string, tipo: Notificacao['tipo'] = 'info'): void {
    const id = crypto.randomUUID();
    this._notificacoes.update(lista => [...lista, { id, mensagem, tipo }]);
    // Remove automaticamente após 4s
    setTimeout(() => this.removerNotificacao(id), 4000);
  }

  sucesso(mensagem: string): void { this.notificar(mensagem, 'sucesso'); }
  erro(mensagem: string): void    { this.notificar(mensagem, 'erro'); }
  aviso(mensagem: string): void   { this.notificar(mensagem, 'aviso'); }

  removerNotificacao(id: string): void {
    this._notificacoes.update(lista => lista.filter(n => n.id !== id));
  }
}

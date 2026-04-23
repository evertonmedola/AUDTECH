import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface LightboxImagem {
  url: string;
  nome: string;
}

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    @if (aberto()) {
      <div
        class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        (click)="fechar()"
      >
        <div class="relative max-w-4xl max-h-full" (click)="$event.stopPropagation()">
          <!-- Botão fechar -->
          <button
            class="absolute -top-10 right-0 text-white hover:text-gray-300"
            (click)="fechar()"
          >
            <mat-icon style="font-size:32px;width:32px;height:32px">close</mat-icon>
          </button>

          <!-- Navegação anterior -->
          @if (imagens().length > 1) {
            <button
              class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 text-white hover:text-gray-300"
              (click)="anterior()"
            >
              <mat-icon style="font-size:36px;width:36px;height:36px">chevron_left</mat-icon>
            </button>
          }

          <!-- Imagem -->
          <img
            [src]="imagemAtual().url"
            [alt]="imagemAtual().nome"
            class="max-w-full max-h-[80vh] rounded-lg object-contain"
          />

          <!-- Nome do arquivo -->
          <p class="text-white text-sm text-center mt-2 opacity-75">
            {{ imagemAtual().nome }}
            @if (imagens().length > 1) {
              <span class="ml-2 opacity-50">{{ indiceAtual() + 1 }} / {{ imagens().length }}</span>
            }
          </p>

          <!-- Navegação próximo -->
          @if (imagens().length > 1) {
            <button
              class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 text-white hover:text-gray-300"
              (click)="proximo()"
            >
              <mat-icon style="font-size:36px;width:36px;height:36px">chevron_right</mat-icon>
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class LightboxComponent {
  readonly aberto = signal(false);
  readonly imagens = signal<LightboxImagem[]>([]);
  readonly indiceAtual = signal(0);

  readonly imagemAtual = () => this.imagens()[this.indiceAtual()] ?? null;

  abrir(imagens: LightboxImagem[], indice = 0): void {
    this.imagens.set(imagens);
    this.indiceAtual.set(indice);
    this.aberto.set(true);
    document.body.style.overflow = 'hidden';
  }

  fechar(): void {
    this.aberto.set(false);
    document.body.style.overflow = '';
  }

  proximo(): void {
    const total = this.imagens().length;
    this.indiceAtual.set((this.indiceAtual() + 1) % total);
  }

  anterior(): void {
    const total = this.imagens().length;
    this.indiceAtual.set((this.indiceAtual() - 1 + total) % total);
  }
}
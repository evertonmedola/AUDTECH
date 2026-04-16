import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="mb-6">
      <!-- Breadcrumb -->
      @if (breadcrumb().length > 0) {
        <nav class="flex items-center gap-1 text-xs text-gray-400 mb-2">
          @for (item of breadcrumb(); track item.label; let last = $last) {
            @if (item.url && !last) {
              <a [routerLink]="item.url" class="hover:text-indigo-600 transition-colors">
                {{ item.label }}
              </a>
              <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
            } @else {
              <span [class.text-gray-600]="last" [class.font-medium]="last">
                {{ item.label }}
              </span>
            }
          }
        </nav>
      }

      <!-- Título + ações -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-medium text-gray-800">{{ titulo() }}</h1>
          @if (subtitulo()) {
            <p class="text-sm text-gray-500 mt-0.5">{{ subtitulo() }}</p>
          }
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  titulo    = input.required<string>();
  subtitulo = input<string>('');
  breadcrumb = input<BreadcrumbItem[]>([]);
}

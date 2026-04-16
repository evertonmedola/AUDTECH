import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <mat-icon class="text-gray-300 mb-4" style="font-size:64px;width:64px;height:64px">
        {{ icone() }}
      </mat-icon>
      <h3 class="text-lg font-medium text-gray-500 mb-1">{{ titulo() }}</h3>
      <p class="text-sm text-gray-400 max-w-xs">{{ descricao() }}</p>
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  icone      = input('inbox');
  titulo     = input('Nenhum item encontrado');
  descricao  = input('Não há registros para exibir.');
}

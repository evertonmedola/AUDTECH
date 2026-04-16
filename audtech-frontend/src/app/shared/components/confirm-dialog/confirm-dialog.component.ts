import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

export interface ConfirmDialogData {
  titulo: string;
  mensagem: string;
  textoBotaoConfirmar?: string;
  textoBotaoCancelar?: string;
  cor?: 'warn' | 'primary';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>
      <p class="text-gray-600">{{ data.mensagem }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">
        {{ data.textoBotaoCancelar ?? 'Cancelar' }}
      </button>
      <button mat-flat-button [color]="data.cor ?? 'warn'" (click)="confirmar()">
        {{ data.textoBotaoConfirmar ?? 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  protected data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  confirmar(): void { this.dialogRef.close(true); }
  cancelar(): void  { this.dialogRef.close(false); }
}

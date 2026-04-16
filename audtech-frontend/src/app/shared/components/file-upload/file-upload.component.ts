import {
  Component, input, output, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  template: `
    <div
      class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
      [class.border-indigo-400]="arrastando()"
      [class.border-gray-300]="!arrastando()"
      [class.bg-indigo-50]="arrastando()"
      (dragover)="onDragOver($event)"
      (dragleave)="arrastando.set(false)"
      (drop)="onDrop($event)"
    >
      <mat-icon class="text-4xl text-gray-400 mb-2" style="font-size:40px;width:40px;height:40px">
        cloud_upload
      </mat-icon>
      <p class="text-sm text-gray-500 mb-3">
        Arraste um arquivo ou
        <button mat-button color="primary" (click)="input.click()">clique para selecionar</button>
      </p>
      <p class="text-xs text-gray-400">JPG, PNG ou PDF — máximo 10 MB</p>

      <input
        #input
        type="file"
        class="hidden"
        [accept]="accept()"
        (change)="onFileChange($event)"
      />
    </div>

    <!-- Preview -->
    @if (preview()) {
      <div class="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        @if (isImagem()) {
          <img [src]="preview()!" class="w-16 h-16 object-cover rounded" alt="preview" />
        } @else {
          <mat-icon class="text-red-500" style="font-size:40px;width:40px;height:40px">picture_as_pdf</mat-icon>
        }
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ arquivoSelecionado()?.name }}</p>
          <p class="text-xs text-gray-400">{{ tamanhoFormatado() }}</p>
        </div>
        <button mat-icon-button (click)="remover()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    }

    @if (carregando()) {
      <mat-progress-bar mode="indeterminate" class="mt-2" />
    }
  `,
})
export class FileUploadComponent {
  accept  = input('.jpg,.jpeg,.png,.pdf');
  carregando = input(false);

  arquivoSelecionado = signal<File | null>(null);
  preview    = signal<string | null>(null);
  arrastando = signal(false);

  arquivoChange = output<File | null>();

  isImagem = computed(() => {
    const f = this.arquivoSelecionado();
    return f ? ['image/jpeg', 'image/png'].includes(f.type) : false;
  });

  tamanhoFormatado = computed(() => {
    const f = this.arquivoSelecionado();
    if (!f) return '';
    const kb = f.size / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
  });

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.arrastando.set(true);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.arrastando.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.processarArquivo(file);
  }

  onFileChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.processarArquivo(file);
  }

  remover(): void {
    this.arquivoSelecionado.set(null);
    this.preview.set(null);
    this.arquivoChange.emit(null);
  }

  private processarArquivo(file: File): void {
    this.arquivoSelecionado.set(file);
    this.arquivoChange.emit(file);

    if (['image/jpeg', 'image/png'].includes(file.type)) {
      const reader = new FileReader();
      reader.onload = e => this.preview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      this.preview.set('pdf');
    }
  }
}

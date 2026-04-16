import {
  Component, ElementRef, ViewChild,
  output, signal, OnDestroy, AfterViewInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <canvas
        #canvas
        width="600"
        height="200"
        class="w-full touch-none cursor-crosshair"
        (mousedown)="iniciar($event)"
        (mousemove)="desenhar($event)"
        (mouseup)="parar()"
        (mouseleave)="parar()"
        (touchstart)="iniciarTouch($event)"
        (touchmove)="desenharTouch($event)"
        (touchend)="parar()"
      ></canvas>
    </div>
    <div class="flex justify-between items-center mt-2">
      <span class="text-xs text-gray-400">
        @if (vazio()) { Assine no campo acima } @else { Assinatura registrada }
      </span>
      <button mat-button (click)="limpar()">
        <mat-icon>refresh</mat-icon> Limpar
      </button>
    </div>
  `,
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  assinaturaChange = output<string | null>();

  private ctx!: CanvasRenderingContext2D;
  private desenhando = false;
  vazio = signal(true);

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.strokeStyle = '#1a237e';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  ngOnDestroy(): void {}

  iniciar(e: MouseEvent): void {
    this.desenhando = true;
    const { x, y } = this.posicao(e);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  desenhar(e: MouseEvent): void {
    if (!this.desenhando) return;
    const { x, y } = this.posicao(e);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.vazio.set(false);
  }

  iniciarTouch(e: TouchEvent): void {
    e.preventDefault();
    this.desenhando = true;
    const { x, y } = this.posicaoTouch(e);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  desenharTouch(e: TouchEvent): void {
    e.preventDefault();
    if (!this.desenhando) return;
    const { x, y } = this.posicaoTouch(e);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.vazio.set(false);
  }

  parar(): void {
    if (this.desenhando) {
      this.desenhando = false;
      if (!this.vazio()) {
        const dataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
        this.assinaturaChange.emit(dataUrl);
      }
    }
  }

  limpar(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.vazio.set(true);
    this.assinaturaChange.emit(null);
  }

  obterBase64(): string | null {
    if (this.vazio()) return null;
    return this.canvasRef.nativeElement.toDataURL('image/png');
  }

  private posicao(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const scaleX = this.canvasRef.nativeElement.width / rect.width;
    const scaleY = this.canvasRef.nativeElement.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private posicaoTouch(e: TouchEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const scaleX = this.canvasRef.nativeElement.width / rect.width;
    const scaleY = this.canvasRef.nativeElement.height / rect.height;
    const touch = e.touches[0];
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }
}

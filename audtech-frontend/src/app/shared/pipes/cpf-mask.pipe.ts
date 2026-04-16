import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cpfMask', standalone: true })
export class CpfMaskPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const d = value.replace(/\D/g, '');
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}

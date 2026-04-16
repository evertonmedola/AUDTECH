import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cnpjMask', standalone: true })
export class CnpjMaskPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const d = value.replace(/\D/g, '');
    return d.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }
}

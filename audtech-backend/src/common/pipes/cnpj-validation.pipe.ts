import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class CnpjValidationPipe implements PipeTransform {
  transform(value: string): string {
    const cnpj = value.replace(/\D/g, '');

    if (!validarCnpj(cnpj)) {
      throw new BadRequestException('CNPJ inválido.');
    }

    return cnpj;
  }
}

export function validarCnpj(cnpj: string): boolean {
  const limpo = cnpj.replace(/\D/g, '');

  if (limpo.length !== 14) return false;
  if (/^(\d)\1+$/.test(limpo)) return false;

  const calcDigito = (base: string, pesos: number[]): number => {
    const soma = base
      .split('')
      .reduce((acc, d, i) => acc + parseInt(d) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcDigito(limpo.slice(0, 12), pesos1);
  if (d1 !== parseInt(limpo[12])) return false;

  const d2 = calcDigito(limpo.slice(0, 13), pesos2);
  return d2 === parseInt(limpo[13]);
}

// Formata CNPJ para exibição: 12.345.678/0001-00
export function formatarCnpj(cnpj: string): string {
  const limpo = cnpj.replace(/\D/g, '');
  return limpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );
}

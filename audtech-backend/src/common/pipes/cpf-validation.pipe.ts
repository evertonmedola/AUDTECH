import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class CpfValidationPipe implements PipeTransform {
  transform(value: string): string {
    const cpf = value.replace(/\D/g, '');

    if (cpf.length !== 11) {
      throw new BadRequestException('CPF deve conter 11 dígitos.');
    }

    // Rejeita sequências repetidas (ex: 111.111.111-11)
    if (/^(\d)\1+$/.test(cpf)) {
      throw new BadRequestException('CPF inválido.');
    }

    if (!this.validarDigitos(cpf)) {
      throw new BadRequestException('CPF inválido.');
    }

    return cpf;
  }

  private validarDigitos(cpf: string): boolean {
    let soma = 0;
    let resto: number;

    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf[i - 1]) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf[i - 1]) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[10])) return false;

    return true;
  }
}

// Função utilitária para usar dentro de class-validator (@Validate)
export function validarCpf(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11 || /^(\d)\1+$/.test(limpo)) return false;

  let soma = 0;
  for (let i = 1; i <= 9; i++) soma += parseInt(limpo[i - 1]) * (11 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo[9])) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(limpo[i - 1]) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(limpo[10]);
}

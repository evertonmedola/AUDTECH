import { PerfilUsuario, Status } from './enums';

export interface Usuario {
  id: number;
  perfil: PerfilUsuario;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
  status: Status;
  empresaId: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateUsuarioDto {
  perfil: PerfilUsuario;
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
  empresaId: number;
}

export interface UpdateUsuarioDto {
  nome?: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
  status?: Status;
  senha?: string;
}

export interface Empresa {
  id: number;
  razaoSocial: string;
  nomeFantasia?: string;
  tipoEmpresa: string;
  cnpj: string;
  telefone?: string;
  status: Status;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateEmpresaDto {
  razaoSocial: string;
  nomeFantasia?: string;
  tipoEmpresa: string;
  cnpj: string;
  telefone?: string;
}

export interface UpdateEmpresaDto extends Partial<CreateEmpresaDto> {
  status?: Status;
}

// Payload do JWT decodificado
export interface JwtPayload {
  sub: number;
  email: string;
  perfil: PerfilUsuario;
  empresaId: number;
  exp: number;
}

// Resposta do login
export interface LoginResponse {
  accessToken: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    perfil: PerfilUsuario;
    empresaId: number;
    nomeEmpresa: string;
  };
}

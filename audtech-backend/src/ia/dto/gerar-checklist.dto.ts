import { IsString, MinLength } from 'class-validator';

export class GerarChecklistDto {
  @IsString()
  @MinLength(10)
  descricao: string;
}

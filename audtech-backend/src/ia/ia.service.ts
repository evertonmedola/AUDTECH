import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `Você é um especialista em normas de qualidade e segurança.
Gere um checklist de auditoria com base na descrição fornecida pelo usuário.

Valores válidos para tipoNorma: ANVISA, ISO_9001, ISO_22000, MAPA, VIGILANCIA_SANITARIA, ISO_45001, ISO_14001, SEM_NORMA

Retorne APENAS JSON válido no seguinte formato, sem texto fora do JSON, sem markdown, sem backticks:
{
  "titulo": "string",
  "tipoNorma": "string",
  "descricao": "string",
  "itens": [
    { "grupo": "string", "descricao": "string", "ordem": 0 }
  ]
}

Regras:
- O campo "ordem" deve ser sequencial começando em 0
- O campo "grupo" deve agrupar itens relacionados (ex: "Documentação", "Equipamentos", "Higiene")
- Escolha o tipoNorma mais adequado à descrição
- Gere pelo menos 8 itens bem distribuídos entre grupos`;

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private readonly groq: Groq;

  constructor(private readonly config: ConfigService) {
    this.groq = new Groq({ apiKey: this.config.get<string>('GROQ_API_KEY') ?? '' });
  }

  async gerarChecklist(descricao: string): Promise<unknown> {
    let raw: string;

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: descricao },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      });
      raw = completion.choices[0].message.content ?? '';
    } catch (err: any) {
      this.logger.error('Erro ao chamar Groq API', err?.message ?? err);
      throw new InternalServerErrorException(
        `Erro ao comunicar com a IA: ${err?.message ?? 'verifique a chave GROQ_API_KEY'}`,
      );
    }

    try {
      return JSON.parse(raw);
    } catch {
      this.logger.error('Resposta da IA não é JSON válido', raw);
      throw new BadRequestException('A IA retornou uma resposta inválida. Tente novamente.');
    }
  }
}

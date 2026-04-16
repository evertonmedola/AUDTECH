import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { ChecklistExecucao } from '../checklist-execucao/checklist-execucao.entity';
import { AcaoCorretiva } from '../plano-acao/acao-corretiva.entity';
import { StatusChecklist, StatusAcao } from '../common/enums/status.enum';

@Injectable()
export class NotificacaoService {
  private readonly logger = new Logger(NotificacaoService.name);

  constructor(
    @InjectRepository(ChecklistExecucao)
    private readonly execucaoRepo: Repository<ChecklistExecucao>,
    @InjectRepository(AcaoCorretiva)
    private readonly acaoRepo: Repository<AcaoCorretiva>,
  ) {}

  /**
   * Roda todo dia às 07:00
   * Verifica prazos de checklists e ações corretivas
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async verificarPrazos(): Promise<void> {
    this.logger.log('Verificando prazos de checklists e ações corretivas...');

    await this.verificarPrazosChecklists();
    await this.verificarPrazosAcoes();
    await this.marcarEmAtraso();
  }

  private async verificarPrazosChecklists(): Promise<void> {
    const dias = [7, 3, 1];

    for (const dia of dias) {
      const dataAlvo = this.dataAlvo(dia);

      const checklists = await this.execucaoRepo.find({
        where: {
          prazo: dataAlvo,
          status: StatusChecklist.PENDENTE,
        },
        relations: ['auditor', 'empresa'],
      });

      for (const checklist of checklists) {
        this.emitirAlerta({
          tipo: 'CHECKLIST_PRAZO',
          diasRestantes: dia,
          destinatario: checklist.auditor?.email,
          mensagem: `Checklist #${checklist.id} vence em ${dia} dia(s). Empresa: ${checklist.empresa?.razaoSocial}`,
        });
      }
    }
  }

  private async verificarPrazosAcoes(): Promise<void> {
    const dias = [7, 3, 1];

    for (const dia of dias) {
      const dataAlvo = this.dataAlvo(dia);

      const acoes = await this.acaoRepo.find({
        where: {
          prazo: dataAlvo,
          status: StatusAcao.PENDENTE,
        },
        relations: ['responsavel', 'planoAcao'],
      });

      for (const acao of acoes) {
        this.emitirAlerta({
          tipo: 'ACAO_PRAZO',
          diasRestantes: dia,
          destinatario: acao.responsavel?.email,
          mensagem: `Ação corretiva #${acao.id} vence em ${dia} dia(s).`,
        });
      }
    }
  }

  private async marcarEmAtraso(): Promise<void> {
    const hoje = new Date().toISOString().split('T')[0];

    // Marca checklists em atraso
    await this.execucaoRepo
      .createQueryBuilder()
      .update(ChecklistExecucao)
      .set({ status: StatusChecklist.EM_ATRASO })
      .where('prazo < :hoje', { hoje })
      .andWhere('status NOT IN (:...statusFinal)', {
        statusFinal: [StatusChecklist.CONCLUIDO, StatusChecklist.EM_ATRASO],
      })
      .execute();

    // Marca ações corretivas em atraso
    await this.acaoRepo
      .createQueryBuilder()
      .update(AcaoCorretiva)
      .set({ status: StatusAcao.EM_ATRASO })
      .where('prazo < :hoje', { hoje })
      .andWhere('status NOT IN (:...statusFinal)', {
        statusFinal: [StatusAcao.CONCLUIDO, StatusAcao.CANCELADO, StatusAcao.EM_ATRASO],
      })
      .execute();

    this.logger.log('Status de atraso atualizado.');
  }

  private dataAlvo(diasAFrente: number): string {
    const d = new Date();
    d.setDate(d.getDate() + diasAFrente);
    return d.toISOString().split('T')[0];
  }

  private emitirAlerta(alerta: {
    tipo: string;
    diasRestantes: number;
    destinatario?: string;
    mensagem: string;
  }): void {
    // Ponto de extensão: integrar e-mail (Nodemailer), push (FCM) ou WebSocket
    // Por ora loga para facilitar debug e futura integração
    this.logger.warn(
      `[${alerta.tipo}] D-${alerta.diasRestantes} | Para: ${alerta.destinatario ?? 'N/A'} | ${alerta.mensagem}`,
    );
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistTemplate } from './checklist-template.entity';
import { ItemTemplate } from './item-template.entity';
import { ChecklistTemplateService } from './checklist-template.service';
import { ChecklistTemplateController } from './checklist-template.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChecklistTemplate, ItemTemplate])],
  providers: [ChecklistTemplateService],
  controllers: [ChecklistTemplateController],
  exports: [ChecklistTemplateService],
})
export class ChecklistTemplateModule {}

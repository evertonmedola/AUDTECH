import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from './empresa.entity';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa]),
    UsuarioModule,
  ],
  providers: [EmpresaService],
  controllers: [EmpresaController],
  exports: [EmpresaService],
})
export class EmpresaModule { }
import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { AgentModule } from '../agent/agent.module';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [AgentModule, SolanaModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
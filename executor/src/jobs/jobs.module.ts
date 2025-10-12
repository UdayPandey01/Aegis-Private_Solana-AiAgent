import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { AgentModule } from '../agent/agent.module';
import { SolanaModule } from '../solana/solana.module';
import { SSEModule } from '../sse/sse.module';
import { PriceModule } from '../price/price.module';

@Module({
  imports: [AgentModule, SolanaModule, SSEModule, PriceModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule { }
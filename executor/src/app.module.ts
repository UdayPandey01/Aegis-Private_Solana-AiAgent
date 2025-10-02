import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'
import { AgentModule } from './agent/agent.module';
import { SolanaModule } from './solana/solana.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // <-- Add this line
    AgentModule, 
    SolanaModule, 
    JobsModule
  ],
})
export class AppModule {}

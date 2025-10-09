import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'
import { AgentModule } from './agent/agent.module';
import { SolanaModule } from './solana/solana.module';
import { JobsModule } from './jobs/jobs.module';
import { PrismaService } from './prisma.service';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    AgentModule, 
    SolanaModule, 
    JobsModule,
    PrismaModule,
    AuthModule
  ],
  providers : [PrismaService],
  exports : [PrismaService]
})
export class AppModule {}

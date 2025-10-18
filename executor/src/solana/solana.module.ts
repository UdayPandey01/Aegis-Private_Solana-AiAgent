import { Module } from '@nestjs/common';
import { SolanaService } from './solana.service';
import { RelayerService } from './relayer.service';
import { SolanaController } from './solana.controller';

@Module({
  controllers: [SolanaController],
  providers: [SolanaService, RelayerService],
  exports: [SolanaService, RelayerService],
})
export class SolanaModule { }
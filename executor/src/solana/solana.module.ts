import { Module } from '@nestjs/common';
import { SolanaService } from './solana.service';
import { RelayerService } from './relayer.service';

@Module({
  providers: [SolanaService, RelayerService],
  exports: [SolanaService, RelayerService],
})
export class SolanaModule {}
import { Injectable, Logger } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { SolanaService } from '../solana/solana.service';
import { RelayerService } from '../solana/relayer.service';

@Injectable()
export class JobsService {
    private readonly logger = new Logger(JobsService.name);

    constructor(
        private readonly agentService: AgentService,
        private readonly solanaService: SolanaService,
        private readonly relayerService: RelayerService,
    ) {}

    async processJob(jobId: number): Promise<void> {
        this.logger.log(`Processing job #${jobId}...`);
        try {
            const journal = await this.agentService.runAgentAndVerify();
            
            const signedTx = await this.solanaService.buildExecuteJobTx(jobId, journal);
            
            await this.relayerService.submitBundle(signedTx);
            
            this.logger.log(`Job #${jobId} completed successfully!`);
        } catch (error) {
            this.logger.error(`Job #${jobId} failed:`, error);
        }
    }
}
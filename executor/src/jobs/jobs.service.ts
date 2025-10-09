import { Injectable, Logger } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { SolanaService } from '../solana/solana.service';
import { RelayerService } from '../solana/relayer.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class JobsService {
    private readonly logger = new Logger(JobsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly agentService: AgentService,
        private readonly solanaService: SolanaService,
        private readonly relayerService: RelayerService,
    ) { }

    async processJob(jobId: number, userWalletAddress: string): Promise<void> {
        this.logger.log(`Processing job #${jobId} for user ${userWalletAddress}...`);

        const job = await this.prisma.job.create({
            data: {
                jobId: jobId,
                agentType: 'arbitrage',
                status: 'PROCESSING',
                user: {
                    connectOrCreate: {
                        where: { walletAddress: userWalletAddress },
                        create: { walletAddress: userWalletAddress },
                    }
                }
            }
        });

        try {
            const journal = await this.agentService.runAgentAndVerify();

            if (journal.length > 0) {
                const signedTx = await this.solanaService.buildExecuteJobTx(jobId, journal);
                const txSignature = await this.relayerService.submitBundle(signedTx);

                await this.prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'COMPLETED', result: txSignature },
                })

                this.logger.log(`Job #${jobId} completed successfully!`);
            } else {
                await this.prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'COMPLETED', result: 'No profitable opportunity found.' },
                });
                this.logger.log(`Job #${jobId} completed. No action taken.`);
            }

        } catch (error) {
            this.logger.error(`Job #${jobId} failed:`, error);
            await this.prisma.job.update({
                where: { id: job.id },
                data: { status: 'FAILED', result: error.message },
            });
        }
    }

    async getJobsForUser(userWalletAddress: string) {
        this.logger.log(`Fetching jobs for user: ${userWalletAddress}`);

        const jobs = await this.prisma.job.findMany({
            where: { userWalletAddress },
            orderBy: { createdAt: 'desc' },
        });

        return jobs.map(job => ({
            ...job,
            jobId: job.jobId.toString(),
        }));
    }

}
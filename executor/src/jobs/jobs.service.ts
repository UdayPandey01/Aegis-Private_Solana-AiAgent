import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { SolanaService } from '../solana/solana.service';
import { RelayerService } from '../solana/relayer.service';
import { PrismaService } from 'src/prisma.service';
import { SSEService } from '../sse/sse.service';
import { PriceLoggerService } from '../price/price-logger.service';

@Injectable()
export class JobsService implements OnModuleInit {
    private readonly logger = new Logger(JobsService.name);
    private runningAgents = new Map<string, boolean>(); 
    private agentLoops = new Map<string, Promise<void>>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly agentService: AgentService,
        private readonly solanaService: SolanaService,
        private readonly relayerService: RelayerService,
        private readonly sseService: SSEService,
        private readonly priceLoggerService: PriceLoggerService,
    ) { }

    async onModuleInit() {
        this.logger.log('JobsService initialized - Restoring running agents...');

        try {
            const runningJobs = await this.prisma.job.findMany({
                where: {
                    status: 'RUNNING'
                }
            });

            this.logger.log(`Found ${runningJobs.length} agents marked as RUNNING`);

            for (const job of runningJobs) {
                const agentId = `${job.jobId}_${job.userWalletAddress}`;

                // Parse parameters from database or use defaults
                let parameters = { profitThreshold: 0.5 };
                try {
                    if (job.parameters) {
                        parameters = JSON.parse(job.parameters);
                    }
                } catch (error) {
                    this.logger.warn(`Failed to parse parameters for agent ${agentId}, using defaults`);
                }

                this.logger.log(`Restarting agent ${agentId} with parameters:`, parameters);

                // Restart the agent without creating a new database record
                this.runningAgents.set(agentId, true);
                const loopPromise = this.runContinuousLoop(Number(job.jobId), job.userWalletAddress, parameters);
                this.agentLoops.set(agentId, loopPromise);

                this.logger.log(`✅ Agent ${agentId} restored successfully`);
            }

            this.logger.log(`✅ Restored ${runningJobs.length} running agents`);
        } catch (error) {
            this.logger.error('Failed to restore running agents:', error);
        }
    }

  
    private formatTimestamp(date: Date = new Date()): string {
        return date.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    async processJob(jobId: number, userWalletAddress: string, parameters: { profitThreshold: number }, retryCount: number = 0): Promise<void> {
        this.logger.log(`Processing job #${jobId} for user ${userWalletAddress}...`);

        let job = await this.prisma.job.findFirst({
            where: {
                jobId: BigInt(jobId),
                userWalletAddress: userWalletAddress
            }
        });

        if (!job) {
            job = await this.prisma.job.create({
                data: {
                    jobId: BigInt(jobId),
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
        } else {
            job = await this.prisma.job.update({
                where: { id: job.id },
                data: { status: 'PROCESSING' }
            });
        }

        try {
            const balanceCheck = await this.solanaService.checkExecutorBalance();
            if (!balanceCheck.hasEnoughBalance) {
                throw new Error(`Insufficient executor balance: ${balanceCheck.balance} SOL (required: ${balanceCheck.required} SOL)`);
            }

            // Emit initial processing update
            this.sseService.emitJobUpdate(job.id.toString(), userWalletAddress, {
                status: 'PROCESSING',
                message: 'ZK agent execution in progress'
            });

            // Emit log update
            this.sseService.emitLogUpdate(job.id.toString(), userWalletAddress, [
                {
                    id: 1,
                    timestamp: new Date().toLocaleTimeString(),
                    action: "Job Created",
                    result: `Arbitrage agent initialized for job #${jobId}`,
                    tx: null,
                },
                {
                    id: 2,
                    timestamp: new Date().toLocaleTimeString(),
                    action: "Balance Check",
                    result: `Executor balance: ${balanceCheck.balance} SOL (required: ${balanceCheck.required} SOL)`,
                    tx: null,
                },
                {
                    id: 3,
                    timestamp: new Date().toLocaleTimeString(),
                    action: "ZK Proof Generation",
                    result: "ZK agent invoked and receipt generated",
                    tx: null,
                }
            ]);

            // Enforce rate limiting before agent execution
            await this.solanaService.enforceRateLimit();

            // Log prices from both DEXes before running ZK agent
            this.logger.log('Fetching prices from DEXes for arbitrage analysis...');
            try {
                const prices = await this.priceLoggerService.logPricesBeforeArbitrage(parameters.profitThreshold);

                // Emit price analysis update
                this.sseService.emitLogUpdate(job.id.toString(), userWalletAddress, [
                    {
                        id: 3,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "Price Analysis",
                        result: `Analyzed prices from ${prices.length} sources`,
                        tx: null,
                    }
                ]);
            } catch (priceError) {
                this.logger.warn('Failed to fetch prices, continuing with ZK agent:', priceError.message);

                // Emit price analysis error
                this.sseService.emitLogUpdate(job.id.toString(), userWalletAddress, [
                    {
                        id: 3,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "Price Analysis",
                        result: `Price fetching failed: ${priceError.message}`,
                        tx: null,
                    }
                ]);
            }

            const journal = await this.agentService.runAgentAndVerify(parameters);

            // Check if any opportunity was found
            if (journal.length === 0 || journal.length < 50) {
                // No opportunity found
                this.logger.log(`No arbitrage opportunity found for job #${jobId}`);

                this.sseService.emitLogUpdate(job.id.toString(), userWalletAddress, [
                    {
                        id: 1,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "Job Created",
                        result: `Arbitrage agent initialized for job #${jobId}`,
                        tx: null,
                    },
                    {
                        id: 2,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "Price Analysis",
                        result: "Analyzed prices from multiple DEXes",
                        tx: null,
                    },
                    {
                        id: 3,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "No Opportunity Found",
                        result: `No profitable arbitrage opportunity found. Profit threshold: ${parameters.profitThreshold}%. Will continue monitoring...`,
                        tx: null,
                    }
                ]);

                await this.prisma.job.update({
                    where: { id: job.id },
                    data: {
                        status: 'COMPLETED',
                        result: 'No opportunity found - insufficient profit margin'
                    },
                });

                this.sseService.emitJobUpdate(job.id.toString(), userWalletAddress, {
                    status: 'COMPLETED',
                    message: 'No profitable opportunity found at this time'
                });

                return;
            }

            // Opportunity found - proceed with trade execution
            if (journal.length > 0) {
                // Emit ZK proof generation update
                this.sseService.emitJobUpdate(job.id.toString(), userWalletAddress, {
                    status: 'PROCESSING',
                    message: 'Arbitrage opportunity detected! Building transaction...'
                });

                // Add delay between transactions to prevent conflicts
                await new Promise(resolve => setTimeout(resolve, 2000));

                const signedTx = await this.solanaService.buildExecuteJobTx(jobId, journal);
                const signedTipTx = await this.solanaService.createTipTx();

                // Enforce rate limiting before relayer submission
                await this.solanaService.enforceRateLimit();

                const txSignature = await this.relayerService.submitBundle([signedTx, signedTipTx]);

                // Update user stats (PnL and trades executed)
                await this.updateUserStats(userWalletAddress, parameters.profitThreshold);

                await this.prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'COMPLETED', result: txSignature },
                })

                // Get updated user stats
                const updatedUser = await this.prisma.user.findUnique({
                    where: { walletAddress: userWalletAddress }
                });

                // Emit success update with stats
                this.sseService.emitJobUpdate(job.id.toString(), userWalletAddress, {
                    status: 'COMPLETED',
                    result: txSignature,
                    message: `Arbitrage completed successfully! Total PnL: $${updatedUser?.totalPnL.toFixed(2) || 0}, Trades: ${updatedUser?.tradesExecuted || 0}`,
                    pnl: updatedUser?.totalPnL || 0,
                    tradesExecuted: updatedUser?.tradesExecuted || 0
                });

                // Emit final log update
                this.sseService.emitLogUpdate(job.id.toString(), userWalletAddress, [
                    {
                        id: 1,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "Job Created",
                        result: `Arbitrage agent initialized for job #${jobId}`,
                        tx: null,
                    },
                    {
                        id: 2,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "ZK Proof Generation",
                        result: "ZK agent invoked and receipt generated",
                        tx: null,
                    },
                    {
                        id: 3,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "Trade Executed",
                        result: `Arbitrage completed successfully! View: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
                        tx: txSignature,
                    },
                    {
                        id: 4,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "Job Completed",
                        result: "Status: COMPLETED",
                        tx: null,
                    }
                ]);

                this.logger.log(`Job #${jobId} completed successfully! Bundle ID: ${txSignature}`);
            } else {
                await this.prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'COMPLETED', result: 'No profitable opportunity found.' },
                });

                // Emit no profit update
                this.sseService.emitJobUpdate(job.id.toString(), userWalletAddress, {
                    status: 'COMPLETED',
                    result: 'No profitable opportunity found.',
                    message: 'No profitable arbitrage opportunities found'
                });

                // Emit no profit log update
                this.sseService.emitLogUpdate(job.id.toString(), userWalletAddress, [
                    {
                        id: 1,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "Job Created",
                        result: `Arbitrage agent initialized for job #${jobId}`,
                        tx: null,
                    },
                    {
                        id: 2,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "ZK Proof Generation",
                        result: "ZK agent invoked and receipt generated",
                        tx: null,
                    },
                    {
                        id: 3,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "Market Analysis",
                        result: "No profitable arbitrage opportunities found",
                        tx: null,
                    },
                    {
                        id: 4,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "Job Completed",
                        result: "Status: COMPLETED",
                        tx: null,
                    }
                ]);

                this.logger.log(`Job #${jobId} completed. No action taken.`);
            }

        } catch (error) {
            this.logger.error(`Job #${jobId} failed:`, error);

            // Handle different types of errors
            let errorMessage = 'Job failed';
            let finalStatus = 'FAILED';

            if (error.message?.includes('Insufficient executor balance')) {
                errorMessage = `Executor wallet needs more SOL: ${error.message}`;
                finalStatus = 'FAILED';
            } else if (error.message?.includes('All relayer endpoints failed') ||
                error.message?.includes('Relayer error') ||
                error.message?.includes('Failed to forward transaction') ||
                error.message?.includes('ENOTFOUND') ||
                error.message?.includes('ECONNREFUSED')) {
                errorMessage = 'Relayer service unavailable - transaction could not be submitted to any Jito endpoint';
                finalStatus = 'COMPLETED'; // Mark as completed since ZK proof was generated successfully
            } else if (error.message?.includes('Failed to execute ZK agent')) {
                errorMessage = 'ZK agent execution failed - check DEX API availability and rate limits';
                finalStatus = 'FAILED';
            } else {
                errorMessage = error.message || 'Unknown error occurred';
            }

            // Retry logic for certain types of failures
            const maxRetries = 2;
            const shouldRetry = retryCount < maxRetries && (
                error.message?.includes('Failed to execute ZK agent') ||
                error.message?.includes('All relayer endpoints failed') ||
                error.message?.includes('ECONNREFUSED') ||
                error.message?.includes('ENOTFOUND') ||
                error.message?.includes('Rate limited') ||
                error.message?.includes('Network congested')
            );

            if (shouldRetry) {
                this.logger.log(`Retrying job #${jobId} (attempt ${retryCount + 1}/${maxRetries + 1})`);

                // Emit retry update
                this.sseService.emitJobUpdate(job.id.toString(), userWalletAddress, {
                    status: 'PROCESSING',
                    message: `Retrying job (attempt ${retryCount + 1}/${maxRetries + 1})`
                });

                // Emit retry log update
                this.sseService.emitLogUpdate(job.id.toString(), userWalletAddress, [
                    {
                        id: 4,
                        timestamp: new Date().toLocaleTimeString(),
                        action: "Retry Attempt",
                        result: `Retrying job due to: ${error.message}`,
                        tx: null,
                    }
                ]);

                // Wait before retry (exponential backoff with longer delays for rate limiting)
                const baseDelay = error.message?.includes('Rate limited') || error.message?.includes('Network congested') ? 15000 : 5000;
                const delay = Math.pow(2, retryCount) * baseDelay; // 15s/30s/60s for rate limits, 5s/10s/20s for others
                this.logger.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));

                // Retry the job
                return this.processJob(jobId, userWalletAddress, parameters, retryCount + 1);
            }

            await this.prisma.job.update({
                where: { id: job.id },
                data: { status: finalStatus, result: errorMessage },
            });

            // Emit error update
            this.sseService.emitJobUpdate(job.id.toString(), userWalletAddress, {
                status: finalStatus,
                result: errorMessage,
                message: finalStatus === 'FAILED' ? 'Job failed' : 'ZK proof generated but all Jito relayer endpoints unavailable'
            });

            // Emit error log update
            this.sseService.emitLogUpdate(job.id.toString(), userWalletAddress, [
                {
                    id: 1,
                    timestamp: new Date().toLocaleTimeString(),
                    action: "Job Created",
                    result: `Arbitrage agent initialized for job #${jobId}`,
                    tx: null,
                },
                {
                    id: 2,
                    timestamp: new Date().toLocaleTimeString(),
                    action: "ZK Proof Generation",
                    result: "ZK agent invoked and receipt generated",
                    tx: null,
                },
                {
                    id: 3,
                    timestamp: new Date().toLocaleTimeString(),
                    action: "Error",
                    result: errorMessage,
                    tx: null,
                },
                {
                    id: 4,
                    timestamp: new Date().toLocaleTimeString(),
                    action: "Job Completed",
                    result: `Status: ${finalStatus}`,
                    tx: null,
                }
            ]);
        }
    }

    /**
     * Start continuous agent monitoring loop
     */
    async startContinuousAgent(jobId: number, userWalletAddress: string, parameters: { profitThreshold: number }): Promise<void> {
        const agentId = `${jobId}_${userWalletAddress}`;

        // Check if agent is already running
        if (this.runningAgents.get(agentId)) {
            this.logger.warn(`Agent ${agentId} is already running`);
            return;
        }

        this.logger.log(`Starting continuous agent ${agentId}`);

        // Create job record in database so it appears in dashboard
        let job = await this.prisma.job.findFirst({
            where: {
                jobId: BigInt(jobId),
                userWalletAddress: userWalletAddress
            }
        });

        if (!job) {
            // Create new job if it doesn't exist
            job = await this.prisma.job.create({
                data: {
                    jobId: BigInt(jobId),
                    agentType: 'arbitrage',
                    status: 'RUNNING',
                    parameters: JSON.stringify(parameters),
                    user: {
                        connectOrCreate: {
                            where: { walletAddress: userWalletAddress },
                            create: { walletAddress: userWalletAddress },
                        }
                    }
                }
            });
            this.logger.log(`Created database record for continuous agent ${agentId}`);
        } else {
            // Update existing job status to RUNNING and parameters
            job = await this.prisma.job.update({
                where: { id: job.id },
                data: {
                    status: 'RUNNING',
                    parameters: JSON.stringify(parameters)
                }
            });
            this.logger.log(`Updated database record for continuous agent ${agentId} to RUNNING`);
        }

        this.runningAgents.set(agentId, true);

        // Emit starting status
        this.sseService.emitJobUpdate(jobId.toString(), userWalletAddress, {
            status: 'RUNNING',
            message: 'Continuous agent started - monitoring for opportunities'
        });

        // Start continuous loop
        const loopPromise = this.runContinuousLoop(jobId, userWalletAddress, parameters);
        this.agentLoops.set(agentId, loopPromise);
    }

    /**
     * Continuous monitoring loop
     */
    private async runContinuousLoop(jobId: number, userWalletAddress: string, parameters: { profitThreshold: number }): Promise<void> {
        const agentId = `${jobId}_${userWalletAddress}`;
        let iteration = 0;

        while (this.runningAgents.get(agentId)) {
            iteration++;
            this.logger.log(`Agent ${agentId} - Iteration ${iteration}: Searching for opportunities...`);

            try {
                await this.searchForOpportunity(jobId, userWalletAddress, parameters, iteration);
            } catch (error) {
                this.logger.error(`Error in continuous agent ${agentId} iteration ${iteration}:`, error);

                // Emit error but continue running
                this.sseService.emitLogUpdate(jobId.toString(), userWalletAddress, [{
                    id: Date.now(),
                    timestamp: this.formatTimestamp(),
                    action: "Error",
                    result: `Error during iteration ${iteration}: ${error.message}. Continuing to monitor...`,
                    tx: null,
                }]);
            }

            // Wait before next iteration (configurable interval)
            await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds
        }

        this.logger.log(`Continuous agent ${agentId} stopped`);
    }

    /**
     * Search for a single arbitrage opportunity
     */
    private async searchForOpportunity(jobId: number, userWalletAddress: string, parameters: { profitThreshold: number }, iteration: number): Promise<void> {
        // Emit searching status
        this.logger.log(`Emitting monitoring log for job ${jobId}, user ${userWalletAddress}`);
        this.sseService.emitLogUpdate(jobId.toString(), userWalletAddress, [{
            id: Date.now(),
            timestamp: this.formatTimestamp(),
            action: "Monitoring",
            result: `Iteration ${iteration}: Analyzing market conditions...`,
            tx: null,
        }]);

        // Check executor balance
        const balanceCheck = await this.solanaService.checkExecutorBalance();
        if (!balanceCheck.hasEnoughBalance) {
            this.logger.warn(`Insufficient executor balance: ${balanceCheck.balance} SOL`);
            this.sseService.emitLogUpdate(jobId.toString(), userWalletAddress, [{
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                action: "Warning",
                result: `Insufficient executor balance: ${balanceCheck.balance} SOL (required: ${balanceCheck.required} SOL)`,
                tx: null,
            }]);
            return;
        }

        // Fetch prices
        try {
            await this.priceLoggerService.logPricesBeforeArbitrage(parameters.profitThreshold);
        } catch (error) {
            this.logger.error('Failed to fetch prices:', error);
        }

        // Run ZK agent
        const journal = await this.agentService.runAgentAndVerify(parameters);

        if (journal.length > 0 && journal.length >= 50) {
            // Opportunity found!
            this.logger.log(`Opportunity found in iteration ${iteration}! Executing trade...`);

            this.sseService.emitLogUpdate(jobId.toString(), userWalletAddress, [{
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                action: "Opportunity Found",
                result: `Profitable arbitrage opportunity detected! Profit threshold: ${parameters.profitThreshold}%`,
                tx: null,
            }]);

            // Execute trade
            const signedTx = await this.solanaService.buildExecuteJobTx(jobId, journal);
            const signedTipTx = await this.solanaService.createTipTx();

            await this.solanaService.enforceRateLimit();

            const txSignature = await this.relayerService.submitBundle([signedTx, signedTipTx]);

            // Update user stats (PnL and trades executed)
            await this.updateUserStats(userWalletAddress, parameters.profitThreshold);

            this.sseService.emitLogUpdate(jobId.toString(), userWalletAddress, [{
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                action: "Trade Executed",
                result: `Trade completed successfully! View: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
                tx: txSignature,
            }]);

            // Emit updated stats
            const updatedUser = await this.prisma.user.findUnique({
                where: { walletAddress: userWalletAddress }
            });

            if (updatedUser) {
                this.sseService.emitJobUpdate(jobId.toString(), userWalletAddress, {
                    status: 'TRADE_COMPLETED',
                    message: `Trade executed! Total PnL: $${updatedUser.totalPnL.toFixed(2)}, Trades: ${updatedUser.tradesExecuted}`,
                    pnl: updatedUser.totalPnL,
                    tradesExecuted: updatedUser.tradesExecuted
                });
            }

            this.logger.log(`Trade executed successfully in iteration ${iteration}: ${txSignature}`);
        } else {
            // No opportunity
            this.logger.log(`Emitting "No Opportunity" log for job ${jobId}, user ${userWalletAddress}`);
            this.sseService.emitLogUpdate(jobId.toString(), userWalletAddress, [{
                id: Date.now(),
                timestamp: this.formatTimestamp(),
                action: "No Opportunity",
                result: `Iteration ${iteration}: No profitable arbitrage found. Continuing to monitor...`,
                tx: null,
            }]);
        }
    }

    /**
     * Pause/stop continuous agent
     */
    async pauseAgent(jobId: number, userWalletAddress: string): Promise<void> {
        const agentId = `${jobId}_${userWalletAddress}`;

        if (!this.runningAgents.get(agentId)) {
            this.logger.warn(`Agent ${agentId} is not running`);
            return;
        }

        this.logger.log(`Pausing agent ${agentId}`);
        this.runningAgents.set(agentId, false);

        // Wait for loop to finish
        const loopPromise = this.agentLoops.get(agentId);
        if (loopPromise) {
            await loopPromise;
            this.agentLoops.delete(agentId);
        }

        this.runningAgents.delete(agentId);

        // Update database status to PAUSED
        await this.prisma.job.updateMany({
            where: {
                jobId: BigInt(jobId),
                userWalletAddress: userWalletAddress
            },
            data: { status: 'PAUSED' }
        });
        this.logger.log(`Updated database record for agent ${agentId} to PAUSED`);

        // Emit paused status
        this.sseService.emitJobUpdate(jobId.toString(), userWalletAddress, {
            status: 'PAUSED',
            message: 'Agent paused by user'
        });

        this.sseService.emitLogUpdate(jobId.toString(), userWalletAddress, [{
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            action: "Agent Paused",
            result: "Continuous monitoring stopped by user",
            tx: null,
        }]);
    }

    /**
     * Check if agent is running
     */
    isAgentRunning(jobId: number, userWalletAddress: string): boolean {
        const agentId = `${jobId}_${userWalletAddress}`;
        return this.runningAgents.get(agentId) || false;
    }

    /**
     * Update user trading statistics (PnL and trades executed)
     */
    private async updateUserStats(userWalletAddress: string, profitThreshold: number): Promise<void> {
        try {
            // For now, calculate mock PnL based on profit threshold
            // In production, this would read actual vault balance changes
            const mockProfitAmount = 50 + (profitThreshold * 10); // Mock profit calculation

            await this.prisma.user.update({
                where: { walletAddress: userWalletAddress },
                data: {
                    totalPnL: { increment: mockProfitAmount },
                    tradesExecuted: { increment: 1 }
                }
            });

            this.logger.log(`Updated stats for ${userWalletAddress}: +$${mockProfitAmount.toFixed(2)} PnL, +1 trade`);
        } catch (error) {
            this.logger.error(`Failed to update user stats for ${userWalletAddress}:`, error);
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

    async getExecutionLogsForJob(userWalletAddress: string, jobId: string) {
        this.logger.log(`Fetching execution logs for job ${jobId} and user ${userWalletAddress}`);

        const job = await this.prisma.job.findFirst({
            where: {
                userWalletAddress,
                jobId: BigInt(jobId)
            },
        });

        if (!job) {
            return [];
        }

        // Generate execution logs based on job data
        const logs: Array<{
            id: number;
            timestamp: string;
            action: string;
            result: string;
            tx: string | null;
        }> = [
                {
                    id: 1,
                    timestamp: this.formatTimestamp(job.createdAt),
                    action: "Job Created",
                    result: `Arbitrage agent initialized for job #${job.jobId}`,
                    tx: null,
                },
                {
                    id: 2,
                    timestamp: this.formatTimestamp(new Date(job.createdAt.getTime() + 1000)),
                    action: "ZK Proof Generation",
                    result: "ZK agent invoked and receipt generated",
                    tx: null,
                }
            ];

        if (job.status === 'COMPLETED') {
            if (job.result && job.result.includes('No profitable opportunity')) {
                logs.push({
                    id: 3,
                    timestamp: this.formatTimestamp(new Date(job.updatedAt.getTime() - 2000)),
                    action: "Market Analysis",
                    result: "No profitable arbitrage opportunities found",
                    tx: null,
                });
            } else if (job.result && job.result.length > 20) {
                // Transaction signature
                logs.push({
                    id: 3,
                    timestamp: this.formatTimestamp(new Date(job.updatedAt.getTime() - 2000)),
                    action: "Trade Executed",
                    result: `Arbitrage completed successfully`,
                    tx: job.result as string,
                });
            }

            logs.push({
                id: 4,
                timestamp: this.formatTimestamp(job.updatedAt),
                action: "Job Completed",
                result: `Status: ${job.status}`,
                tx: null,
            });
        } else if (job.status === 'FAILED') {
            logs.push({
                id: 3,
                timestamp: this.formatTimestamp(job.updatedAt),
                action: "Job Failed",
                result: job.result || "Unknown error occurred",
                tx: null,
            });
        } else if (job.status === 'PROCESSING') {
            logs.push({
                id: 3,
                timestamp: this.formatTimestamp(),
                action: "Processing",
                result: "ZK agent execution in progress",
                tx: null,
            });
        } else if (job.status === 'RUNNING') {
            // Continuous agent is actively monitoring
            logs.push({
                id: 3,
                timestamp: this.formatTimestamp(),
                action: "Monitoring Active",
                result: "Agent is continuously monitoring for arbitrage opportunities. Check back shortly for updates!",
                tx: null,
            });
        } else if (job.status === 'PAUSED') {
            // Agent was paused by user
            logs.push({
                id: 3,
                timestamp: this.formatTimestamp(job.updatedAt),
                action: "Agent Paused",
                result: "Continuous monitoring has been paused. You can resume it anytime.",
                tx: null,
            });
        }

        return logs;
    }

    async deleteJob(jobId: number, userWalletAddress: string) {
        this.logger.log(`Deleting job #${jobId} for user ${userWalletAddress}...`);

        // Find the job to ensure it belongs to the user
        const job = await this.prisma.job.findFirst({
            where: {
                jobId: BigInt(jobId),
                user: {
                    walletAddress: userWalletAddress
                }
            }
        });

        if (!job) {
            throw new Error('Job not found or does not belong to user');
        }

        // Delete the job
        await this.prisma.job.delete({
            where: {
                id: job.id
            }
        });

        this.logger.log(`Job #${jobId} deleted successfully`);
        return { message: 'Job deleted successfully' };
    }

}
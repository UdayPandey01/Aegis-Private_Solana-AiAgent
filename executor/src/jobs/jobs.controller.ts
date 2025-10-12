import { Controller, Post, Body, Res, HttpStatus, Get, Query, Param, Delete } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { SSEService } from '../sse/sse.service';
import type { Response } from 'express';

interface CreateJobDto {
    jobId: number;
    userWalletAddress: string;
    parameters: {
        profitThreshold: number;
    };
}

@Controller('jobs')
export class JobsController {
    constructor(
        private readonly jobsService: JobsService,
        private readonly sseService: SSEService,
    ) { }

    @Post()
    async createJob(@Body() body: CreateJobDto, @Res() res: Response) {
        if (!body.jobId) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing jobId in request.' });
        }

        res.status(HttpStatus.ACCEPTED).json({ message: 'Job accepted and is being processed.' });

        this.jobsService.processJob(body.jobId, body.userWalletAddress, body.parameters);
    }

    @Post('start-continuous')
    async startContinuousAgent(@Body() body: CreateJobDto, @Res() res: Response) {
        if (!body.jobId || !body.userWalletAddress) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing jobId or userWalletAddress in request.' });
        }

        // Check if already running
        const isRunning = this.jobsService.isAgentRunning(body.jobId, body.userWalletAddress);
        if (isRunning) {
            return res.status(HttpStatus.CONFLICT).json({ message: 'Agent is already running for this job.' });
        }

        res.status(HttpStatus.ACCEPTED).json({ message: 'Continuous agent started successfully.' });

        // Start in background
        this.jobsService.startContinuousAgent(body.jobId, body.userWalletAddress, body.parameters);
    }

    @Post('pause/:jobId')
    async pauseAgent(@Param('jobId') jobId: string, @Query('walletAddress') walletAddress: string, @Res() res: Response) {
        if (!walletAddress) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Wallet address is required' });
        }

        const isRunning = this.jobsService.isAgentRunning(parseInt(jobId), walletAddress);
        if (!isRunning) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'No running agent found for this job.' });
        }

        await this.jobsService.pauseAgent(parseInt(jobId), walletAddress);
        return res.status(HttpStatus.OK).json({ message: 'Agent paused successfully.' });
    }

    @Get('status/:jobId')
    async getAgentStatus(@Param('jobId') jobId: string, @Query('walletAddress') walletAddress: string) {
        if (!walletAddress) {
            throw new Error('Wallet address is required');
        }

        const isRunning = this.jobsService.isAgentRunning(parseInt(jobId), walletAddress);
        return {
            jobId: parseInt(jobId),
            walletAddress,
            isRunning,
            status: isRunning ? 'RUNNING' : 'PAUSED'
        };
    }

    @Get()
    async getJobs(@Query('walletAddress') walletAddress: string) {
        if (!walletAddress) {
            throw new Error('Wallet address is required');
        }
        return this.jobsService.getJobsForUser(walletAddress);
    }

    @Get('execution-logs')
    async getExecutionLogs(@Query('walletAddress') walletAddress: string, @Query('jobId') jobId: string) {
        if (!walletAddress) {
            throw new Error('Wallet address is required');
        }
        return this.jobsService.getExecutionLogsForJob(walletAddress, jobId);
    }

    @Get('stream/:jobId')
    async streamJobUpdates(@Param('jobId') jobId: string, @Query('walletAddress') walletAddress: string, @Res() res: Response) {
        if (!walletAddress) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Wallet address is required' });
        }

        // Set proper headers for SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        });

        const clientId = `${jobId}_${walletAddress}_${Date.now()}`;
        this.sseService.addClient(clientId, res, jobId, walletAddress);

        // Send initial connection message
        try {
            res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to job stream' })}\n\n`);

            // Send initial logs from database
            const initialLogs = await this.jobsService.getExecutionLogsForJob(walletAddress, jobId);
            res.write(`data: ${JSON.stringify({ type: 'log_update', data: initialLogs })}\n\n`);
        } catch (error) {
            console.error('Failed to send initial SSE message:', error);
            this.sseService.removeClient(clientId);
            return;
        }

        // Send keep-alive ping every 30 seconds
        const keepAliveInterval = setInterval(() => {
            try {
                if (!res.destroyed && !res.writableEnded) {
                    res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
                } else {
                    clearInterval(keepAliveInterval);
                }
            } catch (error) {
                console.error('Failed to send keep-alive ping:', error);
                clearInterval(keepAliveInterval);
                this.sseService.removeClient(clientId);
            }
        }, 30000);

        // Cleanup on disconnect
        res.on('close', () => {
            clearInterval(keepAliveInterval);
            this.sseService.removeClient(clientId);
        });

        res.on('error', (error) => {
            console.error('SSE connection error:', error);
            clearInterval(keepAliveInterval);
            this.sseService.removeClient(clientId);
        });

        // Handle client disconnect
        res.on('finish', () => {
            clearInterval(keepAliveInterval);
            this.sseService.removeClient(clientId);
        });
    }

    @Delete(':jobId')
    async deleteJob(@Param('jobId') jobId: string, @Query('walletAddress') walletAddress: string) {
        if (!walletAddress) {
            throw new Error('Wallet address is required');
        }
        return this.jobsService.deleteJob(parseInt(jobId), walletAddress);
    }
}
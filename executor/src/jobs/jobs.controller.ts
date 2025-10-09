import { Controller, Post, Body, Res, HttpStatus, Get, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import type { Response } from 'express';

interface CreateJobDto {
  jobId: number;
  userWalletAddress: string; 
  parameters: any; 
}

@Controller('jobs')
export class JobsController {
    constructor(private readonly jobsService: JobsService) {}

    @Post()
    async createJob(@Body() body: CreateJobDto, @Res() res: Response) {
        if (!body.jobId) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing jobId in request.' });
        }
        
        res.status(HttpStatus.ACCEPTED).json({ message: 'Job accepted and is being processed.' });
        
        this.jobsService.processJob(body.jobId, body.userWalletAddress);
    }

    @Get()
    async getJobs(@Query('walletAddress') walletAddress: string) {
        if (!walletAddress) {
            throw new Error('Wallet address is required');
        }
        return this.jobsService.getJobsForUser(walletAddress);
    }
}
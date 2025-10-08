import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { JobsService } from './jobs.service';
import type { Response } from 'express';

@Controller('jobs')
export class JobsController {
    constructor(private readonly jobsService: JobsService) {}

    @Post()
    async createJob(@Body() body: { jobId: number }, @Res() res: Response) {
        if (!body.jobId) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing jobId in request.' });
        }
        
        res.status(HttpStatus.ACCEPTED).json({ message: 'Job accepted and is being processed.' });
        
        this.jobsService.processJob(body.jobId);
    }
}
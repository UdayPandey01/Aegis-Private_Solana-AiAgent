import { Injectable, Logger } from '@nestjs/common';

interface SSEClient {
    id: string;
    response: any;
    jobId: string;
    userWalletAddress: string;
}

@Injectable()
export class SSEService {
    private readonly logger = new Logger(SSEService.name);
    private clients = new Map<string, SSEClient>();

    addClient(id: string, response: any, jobId: string, userWalletAddress: string) {
        this.clients.set(id, {
            id,
            response,
            jobId,
            userWalletAddress,
        });
        this.logger.log(`Added SSE client: ${id} for job ${jobId}`);
    }

    removeClient(id: string) {
        this.clients.delete(id);
        this.logger.log(`Removed SSE client: ${id}`);
    }

    emitJobUpdate(jobId: string, userWalletAddress: string, data: any) {
        const targetClients = Array.from(this.clients.values()).filter(
            client => client.jobId === jobId && client.userWalletAddress === userWalletAddress
        );

        targetClients.forEach(client => {
            try {
                if (client.response.destroyed || client.response.writableEnded) {
                    this.logger.warn(`Client ${client.id} connection is closed, removing`);
                    this.removeClient(client.id);
                    return;
                }

                const message = `data: ${JSON.stringify({ type: 'job_update', data })}\n\n`;
                client.response.write(message);
                this.logger.log(`Emitted job update to client: ${client.id}`);
            } catch (error) {
                this.logger.error(`Failed to emit to client ${client.id}:`, error);
                this.removeClient(client.id);
            }
        });
    }

    emitLogUpdate(jobId: string, userWalletAddress: string, logs: any[]) {
        const targetClients = Array.from(this.clients.values()).filter(
            client => client.jobId === jobId && client.userWalletAddress === userWalletAddress
        );

        if (targetClients.length === 0) {
            this.logger.warn(`No clients found for job ${jobId} and user ${userWalletAddress}. Total clients: ${this.clients.size}`);
            return;
        }

        this.logger.log(`Emitting log update to ${targetClients.length} client(s) for job ${jobId}`);

        targetClients.forEach(client => {
            try {
                if (client.response.destroyed || client.response.writableEnded) {
                    this.logger.warn(`Client ${client.id} connection is closed, removing`);
                    this.removeClient(client.id);
                    return;
                }

                const message = `data: ${JSON.stringify({ type: 'log_update', data: logs })}\n\n`;
                client.response.write(message);
                this.logger.log(`✅ Emitted log update to client: ${client.id} - ${logs.length} log(s)`);
            } catch (error) {
                this.logger.error(`Failed to emit to client ${client.id}:`, error);
                this.removeClient(client.id);
            }
        });
    }
}

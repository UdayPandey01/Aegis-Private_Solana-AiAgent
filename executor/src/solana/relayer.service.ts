import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RelayerService {
    private readonly logger = new Logger(RelayerService.name);
    private readonly relayerUrl = process.env.RELAYER_URL || 'http://localhost:8080/api/v1/bundles';

    async submitBundle(signedTx: string): Promise<string> {
        this.logger.log(`Submitting bundle to relayer: ${this.relayerUrl}`);
        try {
            const payload = { jsonrpc: '2.0', id: 1, method: 'sendBundle', params: [[signedTx]] };
            const response = await axios.post(this.relayerUrl, payload);
            this.logger.log('Bundle submitted successfully:', response.data.result);
            return response.data.result;
        } catch (error) {
            this.logger.error('Failed to submit bundle to relayer:', error.response?.data || error.message);
            throw error;
        }
    }
}
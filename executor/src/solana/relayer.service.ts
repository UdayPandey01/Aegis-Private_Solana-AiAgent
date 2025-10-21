import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Connection } from '@solana/web3.js';
import bs58 from 'bs58';

@Injectable()
export class RelayerService {
    private readonly logger = new Logger(RelayerService.name);
    private lastApiCall = 0;
    private readonly minApiDelay = 2000;
    private readonly rateLimitDelay = 10000;
    private readonly connection: Connection;
    private readonly solanaRpcUrl: string;

    constructor() {
        this.solanaRpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        this.connection = new Connection(this.solanaRpcUrl, 'confirmed');
    }

    private readonly relayerEndpoints = [
        'https://dallas.testnet.block-engine.jito.wtf/api/v1/bundles',
        'https://ny.testnet.block-engine.jito.wtf/api/v1/bundles'
    ];

    private readonly relayerUrl = process.env.RELAYER_URL || this.relayerEndpoints[0];

    private extractSignatureFromSignedTransaction(base58SignedTx: string): string {
        const txBuffer = bs58.decode(base58SignedTx);
        if (txBuffer.length < 64) {
            throw new Error('Signed transaction too short to contain a signature');
        }
        const signatureBytes = txBuffer.subarray(0, 64);
        return bs58.encode(signatureBytes);
    }

    async submitBundle(signedTxs: string[]): Promise<string> {
        const endpoints = process.env.RELAYER_URL ? [process.env.RELAYER_URL] : this.relayerEndpoints;
        let lastError: any;

        await this.enforceRateLimit();

        for (let i = 0; i < endpoints.length; i++) {
            const endpoint = endpoints[i];
            this.logger.log(`Attempting to submit bundle to relayer ${i + 1}/${endpoints.length}: ${endpoint}`);

            try {
                if (!signedTxs || signedTxs.length === 0) {
                    throw new Error('No transactions to submit');
                }

                this.logger.log(`Submitting bundle with ${signedTxs.length} transactions`);
                signedTxs.forEach((tx, index) => {
                    this.logger.log(`Transaction ${index}: ${tx.substring(0, 20)}... (length: ${tx.length})`);
                });

                const payload = { jsonrpc: '2.0', id: 1, method: 'sendBundle', params: [signedTxs] };
                const response = await axios.post(endpoint, payload, {
                    timeout: 30000,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.data.error) {
                    this.logger.error(`Relayer ${endpoint} returned error:`, response.data.error);
                    lastError = new Error(`Relayer error: ${response.data.error.message || response.data.error}`);
                    continue;
                }

                this.logger.log(`Bundle submitted successfully to ${endpoint}:`, response.data.result);

                let derivedSignature: string | undefined;
                try {
                    derivedSignature = this.extractSignatureFromSignedTransaction(signedTxs[0]);
                    this.logger.log(`Derived transaction signature from signedTx[0]: ${derivedSignature}`);

                    const confirmed = await this.waitForConfirmation(derivedSignature);
                    if (!confirmed) {
                        this.logger.warn('Derived signature not confirmed within timeout; returning signature anyway');
                    }
                } catch (sigErr) {
                    this.logger.warn(`Failed to derive/wait signature from signed transaction: ${sigErr.message}. Falling back to direct RPC submit.`);
                    try {
                        return await this.submitDirectToSolana(signedTxs);
                    } catch (fallbackError) {
                        this.logger.error('Fallback direct RPC submission failed after relayer success:', fallbackError.message);
                        return response.data.result;
                    }
                }

                return derivedSignature!;
            } catch (error) {
                lastError = error;
                this.logger.warn(`Failed to submit bundle to ${endpoint}:`, error.message);

                if (error.response) {
                    this.logger.error(`Response status: ${error.response.status}`);
                    this.logger.error(`Response data:`, JSON.stringify(error.response.data));
                    this.logger.error(`Response headers:`, JSON.stringify(error.response.headers));
                }

                if (error.response?.status === 429) {
                    this.logger.warn(`Rate limited by ${endpoint}, waiting ${this.rateLimitDelay}ms before trying next endpoint...`);
                    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
                }

                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    this.logger.log(`DNS/Connection error for ${endpoint}, trying next endpoint...`);
                    continue;
                }

                continue;
            }
        }

        this.logger.warn('All Jito relayer endpoints failed. Attempting direct Solana RPC submission as fallback...');
        try {
            return await this.submitDirectToSolana(signedTxs);
        } catch (fallbackError) {
            this.logger.error('Direct Solana RPC submission also failed:', fallbackError.message);
            throw new Error(`All submission methods failed. Jito error: ${lastError?.message || 'Unknown'}, RPC error: ${fallbackError.message}`);
        }
    }

    private async submitDirectToSolana(signedTxs: string[]): Promise<string> {
        this.logger.log(`Submitting ${signedTxs.length} transaction(s) directly to Solana RPC: ${this.solanaRpcUrl}`);

        const mainTxBase58 = signedTxs[0];

        let mainTxBase64: string;
        try {
            const txBuffer = bs58.decode(mainTxBase58);
            mainTxBase64 = Buffer.from(txBuffer).toString('base64');
            this.logger.log(`Converted transaction from base58 to base64 for RPC submission`);
        } catch (error) {
            this.logger.error('Failed to decode/convert transaction:', error);
            throw new Error(`Transaction format conversion failed: ${error.message}`);
        }

        try {
            const response = await axios.post(this.solanaRpcUrl, {
                jsonrpc: '2.0',
                id: 1,
                method: 'sendTransaction',
                params: [
                    mainTxBase64,
                    {
                        encoding: 'base64',
                        skipPreflight: false,
                        preflightCommitment: 'confirmed',
                        maxRetries: 3
                    }
                ]
            }, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.data.error) {
                this.logger.error('Solana RPC returned error:', response.data.error);
                throw new Error(`RPC error: ${response.data.error.message || JSON.stringify(response.data.error)}`);
            }

            const signature = response.data.result;
            this.logger.log(`Transaction submitted successfully to Solana RPC. Signature: ${signature}`);
            this.logger.log(`View on explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

            this.logger.log('Waiting for transaction confirmation...');
            const confirmed = await this.waitForConfirmation(signature);

            if (!confirmed) {
                throw new Error('Transaction was not confirmed within timeout period');
            }

            return signature;
        } catch (error) {
            this.logger.error('Failed to submit to Solana RPC:', error.response?.data || error.message);
            throw error;
        }
    }

    private async waitForConfirmation(signature: string): Promise<boolean> {
        const maxAttempts = 30;
        const delayMs = 2000;

        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await axios.post(this.solanaRpcUrl, {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getSignatureStatuses',
                    params: [[signature]]
                });

                const status = response.data.result?.value?.[0];

                if (status === null) {
                    this.logger.log(`Attempt ${i + 1}/${maxAttempts}: Transaction not found yet, waiting...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }

                if (status) {
                    if (status.err) {
                        this.logger.error(`Transaction failed on-chain:`, JSON.stringify(status.err));
                        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
                    }

                    this.logger.log(`Attempt ${i + 1}/${maxAttempts}: Status = ${status.confirmationStatus || 'processing'}, slot = ${status.slot}`);

                    if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
                        this.logger.log(`✅ Transaction confirmed with status: ${status.confirmationStatus} at slot ${status.slot}`);
                        return true;
                    }
                }

                await new Promise(resolve => setTimeout(resolve, delayMs));
            } catch (error) {
                this.logger.error(`Error checking confirmation (attempt ${i + 1}/${maxAttempts}):`, error.message);
                if (i === maxAttempts - 1) {
                    this.logger.error(`Transaction confirmation timeout after ${maxAttempts * delayMs / 1000}s`);
                    return false;
                }
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        return false;
    }

    private async enforceRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;

        if (timeSinceLastCall < this.minApiDelay) {
            const delay = this.minApiDelay - timeSinceLastCall;
            this.logger.log(`Rate limiting: waiting ${delay}ms before next API call`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        this.lastApiCall = Date.now();
    }
}
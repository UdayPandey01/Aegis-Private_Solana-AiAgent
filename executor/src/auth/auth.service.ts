import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { sign } from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58"

const challenges = new Map<string, string>()

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) { }

    generateChallenge(publicKey: string): { message: string } {
        const nonce = Math.random().toString(36).substring(2);
        const message = `Please sign this message to log in to Aegis. Nonce: ${nonce}`;
        challenges.set(publicKey, message);
        return { message };
    }

    async validateSignature(publicKeyStr: string, signatureStr: string): Promise<{ token: string }> {
        const message = challenges.get(publicKeyStr);

        if (!message) {
            console.error(`No challenge found for public key: ${publicKeyStr}`);
            throw new Error('No challenge found for this public key. Please request a message first.');
        }

        try {
            const signature = bs58.decode(signatureStr);
            const messageBytes = new TextEncoder().encode(message);
            const publicKey = new PublicKey(publicKeyStr).toBytes();

            const verified = sign.detached.verify(messageBytes, signature, publicKey);

            if (!verified) {
                console.error(`Signature verification failed for ${publicKeyStr}`);
                throw new Error('Invalid signature.');
            }

            challenges.delete(publicKeyStr);

            let user = await this.prisma.user.findUnique({ where: { walletAddress: publicKeyStr } });
            if (!user) {
                console.log(`Creating new user for wallet: ${publicKeyStr}`);
                user = await this.prisma.user.create({ data: { walletAddress: publicKeyStr } });
            }

            const token = `session_token_for_${user.walletAddress}`;
            console.log(`✅ Authentication successful for ${publicKeyStr}`);
            return { token };
        } catch (error) {
            console.error('Signature validation error:', error);
            throw error;
        }
    }

    async checkUserExists(walletAddress: string) {
        const user = await this.prisma.user.findUnique({
            where: { walletAddress },
            include: {
                jobs: true
            }
        });

        return {
            exists: !!user,
            user: user,
            jobCount: user?.jobs?.length || 0
        };
    }

    async listAllUsers() {
        const users = await this.prisma.user.findMany({
            include: {
                jobs: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        });

        return {
            count: users.length,
            users: users.map(user => ({
                walletAddress: user.walletAddress,
                createdAt: user.createdAt,
                jobCount: user.jobs.length
            }))
        };
    }
}
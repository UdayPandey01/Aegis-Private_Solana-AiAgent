import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { SolanaService } from './solana.service';

@Controller('solana')
export class SolanaController {
    constructor(private readonly solanaService: SolanaService) { }

    @Post('transfer-to-vault')
    async transferToVault(@Body() body: { userWalletAddress: string; solAmount: number }) {
        if (!body.userWalletAddress || !body.solAmount) {
            throw new HttpException('User wallet address and SOL amount are required', HttpStatus.BAD_REQUEST);
        }

        try {
            // Convert SOL amount to lamports
            const lamports = Math.floor(body.solAmount * 1000000000); // 9 decimals

            if (lamports < 1000000) { // Minimum 0.001 SOL transfer
                throw new HttpException('Transfer amount too small (minimum 0.001 SOL)', HttpStatus.BAD_REQUEST);
            }

            const result = await this.solanaService.transferSOLToVault(body.userWalletAddress, lamports);

            if (result.success) {
                return {
                    success: true,
                    signature: result.signature,
                    message: `Successfully transferred ${body.solAmount} SOL to vault`
                };
            } else {
                throw new HttpException(result.error || 'Transfer failed', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (error) {
            console.error('Transfer to vault failed:', error);
            throw new HttpException(error.message || 'Transfer failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

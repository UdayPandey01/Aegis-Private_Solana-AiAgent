import { Controller, Post, Body, HttpException, HttpStatus, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('request-message')
  requestMessage(@Body() body: { publicKey: string }) {
    console.log(`📨 Request message request for public key: ${body.publicKey}`);
    if (!body.publicKey) {
      throw new HttpException('Public key is required', HttpStatus.BAD_REQUEST);
    }
    const result = this.authService.generateChallenge(body.publicKey);
    console.log(`📝 Generated challenge for ${body.publicKey}: "${result.message}"`);
    return result;
  }

  @Post('login')
  async login(@Body() body: { publicKey: string; signature: string }) {
    console.log(`🔐 Login attempt for public key: ${body.publicKey}`);
    console.log(`🔑 Signature provided: ${body.signature}`);

    if (!body.publicKey || !body.signature) {
      throw new HttpException('Public key and signature are required', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.authService.validateSignature(body.publicKey, body.signature);
      console.log(`✅ Login successful for ${body.publicKey}`);
      return result;
    } catch (error) {
      console.error(`❌ Login failed for ${body.publicKey}:`, error);
      throw new HttpException(
        error.message || 'Authentication failed',
        HttpStatus.UNAUTHORIZED
      );
    }
  }
}
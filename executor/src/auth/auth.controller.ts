import { Controller, Post, Body, HttpException, HttpStatus, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('request-message')
  requestMessage(@Body() body: { publicKey: string }) {
    if (!body.publicKey) {
      throw new HttpException('Public key is required', HttpStatus.BAD_REQUEST);
    }
    return this.authService.generateChallenge(body.publicKey);
  }

  @Post('login')
  login(@Body() body: { publicKey: string; signature: string }) {
    if (!body.publicKey || !body.signature) {
      throw new HttpException('Public key and signature are required', HttpStatus.BAD_REQUEST);
    }
    return this.authService.validateSignature(body.publicKey, body.signature);
  }

  @Get('debug/check-user')
  async checkUser(@Query('walletAddress') walletAddress: string) {
    if (!walletAddress) {
      throw new HttpException('walletAddress query parameter is required', HttpStatus.BAD_REQUEST);
    }
    return this.authService.checkUserExists(walletAddress);
  }

  @Get('debug/list-users')
  async listUsers() {
    return this.authService.listAllUsers();
  }
}
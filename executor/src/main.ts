import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = [
    'https://aegis-private-solana-ai-agent.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://oyster-app-9rhn5.ondigitalocean.app'
  ];

  if (process.env.FRONTEND_URL) {
    const frontendUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
    if (!allowedOrigins.includes(frontendUrl)) {
      allowedOrigins.push(frontendUrl);
    }
  }

  console.log(`🔧 CORS Configuration:`);
  console.log(`   - FRONTEND_URL env: ${process.env.FRONTEND_URL}`);
  console.log(`   - Allowed origins: ${allowedOrigins.join(', ')}`);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();

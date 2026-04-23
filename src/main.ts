import { createServer, Server } from 'http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  DISCORD_ERRORS,
  DISCORD_ERROR_GUIDES,
} from './constants/error-messages';

function startTempServer(port: number): Promise<Server> {
  return new Promise((resolve) => {
    const server = createServer((_req, res) => {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'starting' }));
    });
    server.listen(port, '0.0.0.0', () => resolve(server));
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

async function bootstrap() {
  const port = Number(process.env.PORT ?? 3000);

  // Render의 port scan이 NestJS init 완료 전에 timeout되지 않도록
  // 임시 HTTP 서버로 포트를 먼저 잡아둔다.
  const tempServer = await startTempServer(port);

  try {
    const app = await NestFactory.create(AppModule);
    await app.init();
    await closeServer(tempServer);
    await app.listen(port, '0.0.0.0');
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(DISCORD_ERRORS.DISALLOWED_INTENTS)
    ) {
      console.error(DISCORD_ERROR_GUIDES.DISALLOWED_INTENTS);
      process.exit(1);
    }
    throw error;
  }
}

void bootstrap();

import { createServer, Server } from 'http';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  DISCORD_ERRORS,
  DISCORD_ERROR_GUIDES,
} from './constants/error-messages';

const logger = new Logger('Bootstrap');

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

  logger.log(`[boot] step 1/5 binding temp server on 0.0.0.0:${port}`);
  const tempServer = await startTempServer(port);
  logger.log('[boot] step 1/5 complete: temp server listening');

  try {
    logger.log('[boot] step 2/5 calling NestFactory.create(AppModule)');
    const app = await NestFactory.create(AppModule);
    logger.log('[boot] step 2/5 complete: Nest application created');

    logger.log('[boot] step 3/5 calling app.init() (runs onApplicationBootstrap hooks)');
    await app.init();
    logger.log('[boot] step 3/5 complete: Nest application initialized');

    logger.log('[boot] step 4/5 closing temp server before app.listen');
    await closeServer(tempServer);
    logger.log('[boot] step 4/5 complete: temp server closed');

    logger.log(`[boot] step 5/5 calling app.listen(${port})`);
    await app.listen(port, '0.0.0.0');
    logger.log('[boot] step 5/5 complete: Nest application listening');
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(DISCORD_ERRORS.DISALLOWED_INTENTS)
    ) {
      console.error(DISCORD_ERROR_GUIDES.DISALLOWED_INTENTS);
      process.exit(1);
    }
    logger.error('[boot] bootstrap failed', error as Error);
    throw error;
  }
}

void bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  DISCORD_ERRORS,
  DISCORD_ERROR_GUIDES,
} from './constants/error-messages';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
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

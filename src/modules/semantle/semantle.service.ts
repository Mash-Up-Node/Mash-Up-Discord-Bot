import { Inject, Injectable } from '@nestjs/common';
import { ThreadAutoArchiveDuration, type AnyThreadChannel } from 'discord.js';
import { SemantleApiError, SEMANTLE_API_CLIENT } from './semantle-api.client';
import type { SemantleApiClient } from './semantle-api.client';
import {
  EmptySemantleGuessError,
  NotSemantleThreadError,
} from './semantle.error';
import {
  formatSemantleGuessReply,
  formatSemantleInvalidGuessReply,
  formatSemantleThreadIntro,
} from './semantle-message.formatter';
import type {
  SemantleGuessSubmitResult,
  SemantleThreadOpenResult,
  SemantleThreadParentChannel,
} from './semantle.type';
import {
  buildSemantleThreadName,
  parseSemantleAnswerIdFromThreadName,
} from './semantle-thread.util';

@Injectable()
export class SemantleService {
  constructor(
    @Inject(SEMANTLE_API_CLIENT)
    private readonly semantleApiClient: SemantleApiClient,
  ) {}

  async openTodayThread(
    channel: SemantleThreadParentChannel,
  ): Promise<SemantleThreadOpenResult> {
    const today = await this.semantleApiClient.fetchToday();
    const threadName = buildSemantleThreadName(today.answer_id);
    const activeThreads = await channel.threads.fetchActive();
    const existingThread =
      activeThreads.threads.find((thread) => thread.name === threadName) ??
      null;

    if (existingThread) {
      return { today, thread: existingThread, created: false };
    }

    const thread = await channel.threads.create({
      name: threadName,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
      reason: `Start Semantle #${today.answer_id}`,
    });

    await thread.send({ content: formatSemantleThreadIntro(today) });

    return { today, thread, created: true };
  }

  async submitGuessFromThread(
    thread: AnyThreadChannel,
    userId: string,
    word: string,
  ): Promise<SemantleGuessSubmitResult> {
    const answerId = parseSemantleAnswerIdFromThreadName(thread.name);
    if (answerId === null) {
      throw new NotSemantleThreadError(thread.name);
    }

    const normalizedWord = word.trim();
    if (!normalizedWord) {
      throw new EmptySemantleGuessError();
    }

    try {
      const result = await this.semantleApiClient.guess(
        answerId,
        normalizedWord,
      );

      return {
        status: result.rank === '정답!' ? 'correct' : 'guessed',
        answerId,
        word: normalizedWord,
        result,
        content: formatSemantleGuessReply(userId, result),
      };
    } catch (error) {
      if (
        error instanceof SemantleApiError &&
        error.status === 404 &&
        error.detail?.type === 'InvalidGuess'
      ) {
        return {
          status: 'invalid_guess',
          answerId,
          word: normalizedWord,
          content: formatSemantleInvalidGuessReply(normalizedWord),
        };
      }

      throw error;
    }
  }
}

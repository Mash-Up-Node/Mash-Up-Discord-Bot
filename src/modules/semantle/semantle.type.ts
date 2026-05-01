import type { AnyThreadChannel, NewsChannel, TextChannel } from 'discord.js';
import type {
  SemantleGuessResponse,
  SemantleTodayResponse,
} from './semantle-api.client';

export type SemantleThreadParentChannel = TextChannel | NewsChannel;

export interface SemantleThreadOpenResult {
  today: SemantleTodayResponse;
  thread: AnyThreadChannel;
  created: boolean;
}

export type SemantleGuessSubmitResult =
  | {
      status: 'guessed' | 'correct';
      answerId: number;
      word: string;
      result: SemantleGuessResponse;
      content: string;
    }
  | {
      status: 'invalid_guess';
      answerId: number;
      word: string;
      content: string;
    };

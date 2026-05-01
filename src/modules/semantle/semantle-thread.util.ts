export const SEMANTLE_THREAD_NAME_PREFIX = '꼬맨틀';

const SEMANTLE_THREAD_NAME_REGEX = /^꼬맨틀 #(\d+)$/;

export function buildSemantleThreadName(answerId: number): string {
  return `${SEMANTLE_THREAD_NAME_PREFIX} #${answerId}`;
}

export function parseSemantleAnswerIdFromThreadName(
  threadName: string,
): number | null {
  const match = SEMANTLE_THREAD_NAME_REGEX.exec(threadName.trim());
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

export function isSemantleThreadName(threadName: string): boolean {
  return parseSemantleAnswerIdFromThreadName(threadName) !== null;
}

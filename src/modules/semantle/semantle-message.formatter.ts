import {
  SemantleGuessResponse,
  SemantleGuessRank,
  SemantleTodayResponse,
} from './semantle-api.client';

export function formatSemantleScore(score: number): string {
  return (score * 100).toFixed(2);
}

export function formatSemantleRank(rank: SemantleGuessRank): string {
  return typeof rank === 'number' ? `${rank}위` : rank;
}

export function formatSemantleThreadIntro(
  today: SemantleTodayResponse,
): string {
  return [
    `## 꼬맨틀 #${today.answer_id}`,
    '',
    '정답 단어를 맞혀보세요.',
    '',
    `- 가장 유사한 단어의 유사도: ${formatSemantleScore(today['1st_score'])}`,
    `- 10번째 단어 유사도: ${formatSemantleScore(today['10th_score'])}`,
    `- 1,000번째 단어 유사도: ${formatSemantleScore(today['1000th_score'])}`,
    '',
    '추측 방법: 이 스레드에서 `/꼬맨틀 word:단어`을 입력하세요.',
    '정답을 맞힌 뒤에도 계속 추측할 수 있습니다.',
  ].join('\n');
}

export function formatSemantleGuessReply(
  userId: string,
  result: SemantleGuessResponse,
): string {
  const score = formatSemantleScore(result.sim);
  const rank = formatSemantleRank(result.rank);

  if (result.rank === '정답!') {
    return `🎉 <@${userId}> 님이 정답 \`${result.guess}\`을(를) 맞혔습니다! 유사도 ${score} 입니다. 그래도 계속 추측할 수 있어요.`;
  }

  return `<@${userId}> 님의 \`${result.guess}\`는 유사도 ${score} (유사도 순위 ${rank}) 입니다.`;
}

export function formatSemantleInvalidGuessReply(word: string): string {
  return `\`${word}\`은(는) 알 수 없는 단어입니다.`;
}

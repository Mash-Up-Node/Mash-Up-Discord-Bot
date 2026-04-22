import { TodayFortune } from '../types/today-fortune.type';

export function formatTodayFortune(
  fortune: TodayFortune,
  title = '오늘의 운세',
): string {
  return [
    `**${title}**`,
    `입력: ${fortune.gender} / ${fortune.birthDate}`,
    `총운 키워드: ${fortune.keyword}`,
    `기준일: ${fortune.date}`,
    `총운: ${fortune.summary}`,
  ].join('\n');
}

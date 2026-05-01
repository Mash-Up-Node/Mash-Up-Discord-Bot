import {
  DAY_OF_WEEK_FULL_LABELS,
  DayOfWeek,
} from '../constants/reservation.constants';

export function formatWeeklyLabel(
  dayOfWeek: DayOfWeek,
  timeOfDay: string,
): string {
  return `매주 ${DAY_OF_WEEK_FULL_LABELS[dayOfWeek]} ${timeOfDay}`;
}

export function formatRelativeFromNow(
  target: Date,
  reference: Date = new Date(),
): string {
  const diffMs = target.getTime() - reference.getTime();
  const absMinutes = Math.floor(Math.abs(diffMs) / 60000);
  const isPast = diffMs < 0;

  if (absMinutes < 1) return '곧';

  const days = Math.floor(absMinutes / (60 * 24));
  const hours = Math.floor((absMinutes % (60 * 24)) / 60);
  const minutes = absMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}일`);
  if (hours > 0) parts.push(`${hours}시간`);
  if (days === 0 && minutes > 0) parts.push(`${minutes}분`);
  if (parts.length === 0) parts.push('1분');

  const label = parts.slice(0, 2).join(' ');
  return isPast ? `${label} 전` : `${label} 후`;
}

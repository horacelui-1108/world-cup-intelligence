import { formatInTimeZone } from 'date-fns-tz';

/** e.g. 「7月20日 03:00」 in the given IANA zone */
export function kickoffLabel(isoUtc: string, timeZone: string): string {
  return formatInTimeZone(new Date(isoUtc), timeZone, 'M月d日 HH:mm');
}

/** e.g. 「7月19日 15:00」 with weekday: 「7月19日(週日) 15:00」 */
export function kickoffLabelWithWeekday(isoUtc: string, timeZone: string): string {
  const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const d = new Date(isoUtc);
  const dayIdx = Number(formatInTimeZone(d, timeZone, 'i')) % 7;
  return `${formatInTimeZone(d, timeZone, 'M月d日 HH:mm')} ${weekdays[dayIdx]}`;
}

/** HH:mm only */
export function timeLabel(isoUtc: string, timeZone: string): string {
  return formatInTimeZone(new Date(isoUtc), timeZone, 'HH:mm');
}

const WEEKDAYS_FULL = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/** e.g. 「2026年7月19日 星期日」 */
export function fullDateLabel(isoUtc: string, timeZone: string): string {
  const d = new Date(isoUtc);
  const dayIdx = Number(formatInTimeZone(d, timeZone, 'i')) % 7;
  return `${formatInTimeZone(d, timeZone, 'yyyy年M月d日')} ${WEEKDAYS_FULL[dayIdx]}`;
}

/** Relative past label in TC: 剛剛 / N 分鐘前 / N 小時前 / N 日前 */
export function relativePast(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 日前`;
}

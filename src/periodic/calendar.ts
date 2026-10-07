import dayjs, { type Dayjs } from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import type { PluginSettings } from '../type';
import { joinVaultPath, buildPeriodicFilePath } from './paths';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);
dayjs.extend(advancedFormat);

// Existing settings use locale-week tokens. LifeOS queries interpret week names as ISO weeks.
export function isoWeeklyFormat(format: string): string {
  return format.replace(/\[[^\]]*\]|gggg|ww|w/g, (token) =>
    token.startsWith('[') ? token : ({ gggg: 'GGGG', ww: 'WW', w: 'W' }[token] ?? token),
  );
}

export function periodicLocation(date: Dayjs, period: string, settings: PluginSettings) {
  const root = settings.periodicNotesPath.replace(/\/$/, '');
  const year = date.format('YYYY');
  const formats: Record<string, string> = {
    Daily: settings.dailyNoteFormat || 'YYYY-MM-DD',
    Weekly: isoWeeklyFormat(settings.weeklyNoteFormat || 'gggg-[W]ww'),
    Monthly: settings.monthlyNoteFormat || 'YYYY-MM',
    Quarterly: settings.quarterlyNoteFormat || 'YYYY-[Q]Q',
    Yearly: settings.yearlyNoteFormat || 'YYYY',
  };
  if (!formats[period]) throw new Error(`Unknown period: ${period}`);
  const periodYear = period === 'Weekly' ? String(date.isoWeekYear()) : year;
  const folder = joinVaultPath(root, periodYear, period === 'Yearly' ? '' : period, period === 'Daily' ? date.format('MM') : '');
  const file = buildPeriodicFilePath(root, periodYear, period, date.format(formats[period]), date.format('MM'));
  return { folder, file };
}

export function isoWeekRange(year: number, week: number) {
  if (!Number.isInteger(year) || year < 1 || !Number.isInteger(week) || week < 1 || week > 53) {
    return { from: null, to: null };
  }
  const start = dayjs(`${year}-01-04`)
    .startOf('isoWeek')
    .add(week - 1, 'week');
  if (start.isoWeekYear() !== year) return { from: null, to: null };
  return { from: start.format('YYYY-MM-DD'), to: start.add(6, 'day').format('YYYY-MM-DD') };
}

import dayjs from 'dayjs';
import type { CaptureRecord } from './history';
export type CaptureDatePreset = 'all' | 'today' | '7d' | '30d' | 'custom';
export function captureDateRange(preset: CaptureDatePreset, now: Date = new Date()): { from: string; to: string } {
  if (preset === 'all' || preset === 'custom') return { from: '', to: '' };
  const today = dayjs(now);
  return {
    from: today.subtract(preset === '7d' ? 6 : preset === '30d' ? 29 : 0, 'day').format('YYYY-MM-DD'),
    to: today.format('YYYY-MM-DD'),
  };
}
export function sameCapture(a: CaptureRecord, b: CaptureRecord): boolean {
  if (a.path !== b.path) return false;
  if (a.blockId && b.blockId) return a.blockId === b.blockId;
  return a.raw === b.raw && (!(a.ambiguous || b.ambiguous) || a.line === b.line);
}

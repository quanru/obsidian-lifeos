import assert from 'node:assert/strict';
import test from 'node:test';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import { isoWeekRange, periodicLocation } from './calendar.ts';
import { Date as PeriodicDate } from './Date.ts';
import { memoryApp, settings } from '../../tests/vault.ts';

test('ISO week names and folders agree across year boundaries in English and Chinese', () => {
  for (const locale of ['en', 'zh-cn']) {
    const location = periodicLocation(dayjs('2021-01-01').locale(locale), 'Weekly', settings);
    assert.equal(location.file, 'Journal/2020/Weekly/2020-W53.md');
    assert.equal(
      periodicLocation(dayjs('2024-12-30').locale(locale), 'Weekly', settings).file,
      'Journal/2025/Weekly/2025-W01.md',
    );
  }
  assert.deepEqual(isoWeekRange(2020, 53), { from: '2020-12-28', to: '2021-01-03' });
  assert.deepEqual(isoWeekRange(2021, 53), { from: null, to: null });
  assert.deepEqual(isoWeekRange(2025, 1), { from: '2024-12-30', to: '2025-01-05' });
});

test('custom date formats preserve literal text and match quarterly folders', () => {
  assert.equal(
    periodicLocation(dayjs('2025-01-02'), 'Weekly', { ...settings, weeklyNoteFormat: 'gggg-[W]ww [weekly]' }).file,
    'Journal/2025/Weekly/2025-W01 weekly.md',
  );
  assert.equal(periodicLocation(dayjs('2025-04-03'), 'Quarterly', settings).file, 'Journal/2025/Quarterly/2025-Q2.md');
});

test('weekly query range, final day and daily file lookup agree', async () => {
  const { app } = memoryApp();
  const note = await app.vault.create('Journal/2020/Weekly/2020-W53.md', '');
  for (const date of ['2020-12-28', '2021-01-03'])
    await app.vault.create(periodicLocation(dayjs(date), 'Daily', settings).file, '');
  const files = { get: (path, _unused, root) => app.vault.getAbstractFileByPath(`${root}/${path}`) };
  const helper = new PeriodicDate(app, settings, files, 'en');
  const parsed = helper.parse(note.path);
  assert.deepEqual(helper.days(parsed), { from: '2020-12-28', to: '2021-01-03' });
  assert.equal(helper.lastDay(parsed).week, '2021-01-03');
  assert.equal(helper.files(parsed).days.length, 2);
});

test('leap day, monthly and quarterly ranges stay within their calendar periods', () => {
  const { app } = memoryApp();
  const helper = new PeriodicDate(app, settings, {}, 'en');
  const base = { year: 2024, month: null, quarter: null, week: null, day: null };
  assert.deepEqual(helper.days({ ...base, month: 2 }), { from: '2024-02-01', to: '2024-02-29' });
  assert.deepEqual(helper.days({ ...base, quarter: 1 }), { from: '2024-01-01', to: '2024-03-31' });
  assert.deepEqual(helper.days({ ...base, month: 2, day: 29 }), { from: '2024-02-29', to: '2024-02-29' });
  assert.equal(periodicLocation(dayjs('2024-02-29'), 'Daily', settings).file, 'Journal/2024/Daily/02/2024-02-29.md');
});


test('root and trailing-slash settings share the same paths for creation and queries', () => {
  for (const root of ['/', 'Journal/', 'Journal']) {
    const prefix = root === '/' ? '' : 'Journal/';
    const configured = { ...settings, periodicNotesPath: root };
    const daily = periodicLocation(dayjs('2021-01-01'), 'Daily', configured);
    assert.equal(daily.file, `${prefix}2021/Daily/01/2021-01-01.md`);
    assert.equal(daily.folder, `${prefix}2021/Daily/01`);
    assert.equal(periodicLocation(dayjs('2021-01-01'), 'Weekly', configured).file, `${prefix}2020/Weekly/2020-W53.md`);
    assert.equal(periodicLocation(dayjs('2021-01-01'), 'Yearly', configured).file, `${prefix}2021/2021.md`);
  }
});

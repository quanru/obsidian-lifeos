import assert from 'node:assert/strict';
import test from 'node:test';
import dayjs from 'dayjs';
import { memoryApp, settings } from '../../tests/vault.ts';
import { collectWeeklyReview, saveWeeklyReview, weeklyReviewPath } from './weekly-review.ts';
import { collectDailyEntries, renderReview, updateReview, REVIEW_START, REVIEW_END } from './content.ts';
import { getReviewI18n } from './i18n.ts';
import { periodicLocation } from '../periodic/calendar.ts';

test('daily parsing skips frontmatter, code, blank tasks and records outside the capture section', () => {
  const text =
    '---\n- [x] Metadata\n---\n## Daily Record\n- 09:00 Progress\n- [x] Done\n- [ ] Next\n- [ ] \n```md\n- [x] Example\n```\n## Habits\n- [ ] Walk\n- Not a captured record';
  const result = collectDailyEntries('Day.md', text, 'Daily Record');
  assert.deepEqual(
    result.records.map((e) => e.text),
    ['09:00 Progress'],
  );
  assert.deepEqual(
    result.done.map((e) => e.text),
    ['Done'],
  );
  assert.deepEqual(
    result.open.map((e) => e.text),
    ['Next', 'Walk'],
  );
});

test('cross-year review gathers only seven daily notes and projects updated within that week', async () => {
  const { app } = memoryApp();
  for (const date of ['2020-12-27', '2020-12-28', '2021-01-03', '2021-01-04']) {
    await app.vault.create(
      periodicLocation(dayjs(date), 'Daily', settings).file,
      `## Daily Record\n- ${date}\n- [x] Completed\n- [ ] Pending\n`,
    );
  }
  const project = await app.vault.create('Projects/Launch/README.md', '');
  project.stat.mtime = dayjs('2021-01-02').valueOf();
  const old = await app.vault.create('Projects/Old/README.md', '');
  old.stat.mtime = dayjs('2020-12-27').valueOf();
  const template = await app.vault.create('Projects/Template.md', '');
  template.stat.mtime = dayjs('2021-01-02').valueOf();
  const data = await collectWeeklyReview(app, settings, dayjs('2021-01-01'));
  assert.equal(data.from, '2020-12-28');
  assert.equal(data.to, '2021-01-03');
  assert.equal(data.records.length, 2);
  assert.equal(data.done.length, 2);
  assert.equal(data.open.length, 2);
  assert.deepEqual(
    data.projects.map((p) => p.path),
    [project.path],
  );
  const text = renderReview(data, getReviewI18n('en'));
  assert.ok(!text.includes('- [x]'));
  assert.ok(!text.includes('- [ ]'));
  assert.match(text, /\[\[Journal\/2020\/Daily\/12\/2020-12-28\|2020-12-28\]\]/);
});

test('save and refresh need neither Dataview nor templates and preserve personal reflections', async () => {
  const { app, contents } = memoryApp();
  const date = dayjs('2026-10-07');
  const path = weeklyReviewPath(date, settings);
  await saveWeeklyReview(app, settings, date, 'zh-cn');
  const initial = contents.get(path)!;
  contents.set(path, `Personal preface\n${initial}\nMy private reflection\n`);
  await app.vault.create(periodicLocation(date, 'Daily', settings).file, '## Daily Record\n- Fresh progress');
  await saveWeeklyReview(app, settings, date, 'zh-cn');
  const refreshed = contents.get(path)!;
  assert.ok(refreshed.startsWith('Personal preface\n'));
  assert.ok(refreshed.endsWith('\nMy private reflection\n'));
  assert.match(refreshed, /Fresh progress/);
  assert.equal(refreshed.split(REVIEW_START).length, 2);
});

test('refuses to replace user files and malformed generated sections', async () => {
  const t = getReviewI18n('en');
  for (const content of [
    'Personal note',
    REVIEW_END + REVIEW_START,
    REVIEW_START + REVIEW_START + REVIEW_END,
    REVIEW_START + REVIEW_END + REVIEW_END,
  ]) {
    assert.throws(() => updateReview(content, 'Generated', t), /content was kept/);
  }
  const { app, contents } = memoryApp();
  const date = dayjs('2026-10-07');
  const path = weeklyReviewPath(date, settings);
  await app.vault.create(path, 'Personal note');
  await assert.rejects(saveWeeklyReview(app, settings, date, 'en'), /content was kept/);
  assert.equal(contents.get(path), 'Personal note');
});

test('review text cannot inject managed markers and all three locales have complete copy', () => {
  for (const locale of ['en', 'zh-cn', 'zh-tw']) {
    const t = getReviewI18n(locale);
    assert.deepEqual(Object.keys(t).sort(), Object.keys(getReviewI18n('en')).sort());
    const generated = renderReview(
      {
        from: '2026-10-05',
        to: '2026-10-11',
        records: [{ path: 'Day.md', text: REVIEW_END }],
        done: [],
        open: [],
        projects: [],
      },
      t,
    );
    assert.ok(!generated.includes(REVIEW_END));
    assert.match(updateReview(undefined, generated, t), /lifeos:weekly-review:start/);
  }
});

test('weekly review keeps rich capture blocks together and includes their nested tasks', () => {
  const content = '## Daily Record\n- 09:00 Progress\n  **Details** #work\n  ![[image.png]]\n  - [ ] Follow up\n\n- 10:00\n  # A heading inside a record\n  More context\n\n## Habits\n- [x] Walk';
  const result = collectDailyEntries('Day.md', content, 'Daily Record');
  assert.equal(result.records.length, 2);
  assert.match(result.records[0].text, /Details.*#work\n!\[\[image.png\]\]\n- \[ \] Follow up/);
  assert.match(result.records[1].text, /A heading inside a record\nMore context/);
  assert.equal(result.open.length, 1);
  assert.equal(result.done.length, 1);
});


test('weekly review hides capture block identifiers without rewriting the daily note', () => {
  const content = '## Daily Record\n- [ ] Finish release ^capture-1234-abcd\n';
  const entries = collectDailyEntries('Journal/2026/Daily/10/2026-10-07.md', content, 'Daily Record');
  assert.equal(entries.open[0].text, 'Finish release');
  assert(content.includes('^capture-1234-abcd'));
});

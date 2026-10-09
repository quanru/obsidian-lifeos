import assert from 'node:assert/strict';
import test from 'node:test';
import { readCaptureRecords, replaceCaptureRecord, CaptureConflict } from './history.ts';
import { appendUnderHeading } from './content.ts';
import { CaptureRepository } from './repository.ts';
import { memoryApp, settings } from '../../tests/vault.ts';

const path = 'Journal/2026/Daily/10/2026-10-08.md';
const parse = (text: string, header = 'Records', habit = 'Habits') =>
  readCaptureRecords(text, path, '2026-10-08', header, habit);

test('only the nearest record heading counts, including subsections and repeated sections', () => {
  const text =
    '## Records\n- Keep one\n### Habit statistics\n- Hidden bullet\n- [ ] Hidden task\n### Other\n- Hidden other\n## Records\n- [ ] Keep two\n';
  assert.deepEqual(
    parse(text).map((r) => r.text),
    ['Keep one', 'Keep two'],
  );
});

test('supports legacy record titles, case differences and heading markers', () => {
  const text = '# 日常记录\n- 简体\n## 日常記錄\n- 繁體\n## dAiLy ReCoRd\n- English\n## CUSTOM\n- Custom\n';
  assert.deepEqual(
    parse(text, '## Custom').map((r) => r.text),
    ['简体', '繁體', 'English', 'Custom'],
  );
  assert.equal(parse('## Other\n- Not a record\n').length, 0);
});

test('habit exclusion takes precedence over record aliases and normalizes dots and whitespace', () => {
  assert.equal(parse('## 日常记录\n- [ ] Habit\n', 'Records', '## 日常记录.').length, 0);
  assert.equal(parse('## Daily   Record.\n- Habit\n', 'Daily Record.', 'Daily Record.').length, 0);
  assert.equal(parse('## Habits\n- Habit\n', 'Habits', '## Habits.').length, 0);
});

test('keeps embedded headings and nested tasks in a capture and ignores fenced heading examples', () => {
  const text =
    '## Records\n- 10:00 Keep\n  ## Habits\n  - [ ] Nested\n\n```md\n## Habits\n- Example\n```\n- Keep later\n';
  const records = parse(text);
  assert.equal(records.length, 2);
  assert.match(records[0].text, /## Habits\n- \[ \] Nested/);
  assert.equal(records[1].text, 'Keep later');
});

test('new captures are inserted before subheadings and cannot edit a record moved into habits', () => {
  const text = '## Records\n- 10:00 Old\n### Habits\n- [ ] Keep this habit\n';
  const updated = appendUnderHeading(text, 'Records', '- 11:00 New');
  assert.deepEqual(
    parse(updated).map((r) => r.text),
    ['Old', 'New'],
  );
  assert.match(updated, /### Habits\n- \[ \] Keep this habit/);
  const old = parse(text)[0];
  assert.throws(
    () => replaceCaptureRecord('## Records\n### Habits\n- 10:00 Old\n', old, 'Records', null, 'Habits'),
    CaptureConflict,
  );
});

test('repository uses the configured habit title for reads and conflict-protected writes', async () => {
  const { app, contents } = memoryApp();
  const text = '## Daily Record\n- 10:00 Old\n';
  await app.vault.create(path, text);
  const repo = new CaptureRepository(app, { ...settings, habitHeader: 'Daily Record.' });
  assert.equal((await repo.list()).length, 0);
  const record = parse(text, 'Daily Record', 'Other')[0];
  await assert.rejects(repo.replace(record, null), CaptureConflict);
  assert.equal(contents.get(path), text);
});

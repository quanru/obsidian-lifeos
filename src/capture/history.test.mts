import assert from 'node:assert/strict';
import test from 'node:test';
import { readCaptureRecords, replaceCaptureRecord, revisedRecord, toggleRecordTask, filterRecords, CaptureConflict, recordTags } from './history.ts';
import { formatCaptureEntry } from './content.ts';
import { CaptureRepository } from './repository.ts';
import { memoryApp, settings } from '../../tests/vault.ts';
const path = 'Journal/2026/Daily/10/2026-10-07.md';
const content = '---\ntext: ignored\n---\n\n## Daily Record\n\n- 10:00 First #work #计划\n  ![[image.png]]\n  - [ ] Nested task\n\n- [x] Done #work\n\n```md\n- Not a capture\n```\n\n## Reflection\n- Keep this\n';
const read = (text = content) => readCaptureRecords(text, path, '2026-10-07', 'Daily Record');

test('reads historical multiline records and tasks, excluding other sections and fenced examples', () => {
  const records = read(); assert.equal(records.length, 2);
  assert.equal(records[0].text, 'First #work #计划\n![[image.png]]\n- [ ] Nested task');
  assert.deepEqual(records[0].tags, ['work', '计划']);
  assert.equal(records[1].kind, 'task'); assert.equal(records[1].checked, true);
});
test('edits moved blocks while preserving neighbors and rejects stale or ambiguous blocks', () => {
  const record = read()[0];
  const moved = content.replace('## Daily Record\n', '## Daily Record\n\nA new paragraph\n');
  const changed = replaceCaptureRecord(moved, record, 'Daily Record', revisedRecord(record, 'Updated\nwith context'));
  assert.match(changed, /- 10:00 Updated\n  with context/); assert.match(changed, /- \[x\] Done/); assert.match(changed, /- Keep this/);
  assert.throws(() => replaceCaptureRecord(content.replace('Nested task', 'Changed elsewhere'), record, 'Daily Record', null), CaptureConflict);
  assert.throws(() => replaceCaptureRecord(content.replace('- [x] Done #work', record.raw), record, 'Daily Record', null), CaptureConflict);
});
test('delete removes only its complete block and preserves surrounding whitespace and content', () => {
  const result = replaceCaptureRecord(content, read()[0], 'Daily Record', null);
  assert.ok(!result.includes('Nested task')); assert.ok(result.includes('Done #work')); assert.ok(result.endsWith('- Keep this\n'));
});
test('filters combine case insensitive search, all selected tags and inclusive dates', () => {
  assert.equal(filterRecords(read(), { keyword: 'FIRST', tags: ['work', '计划'], from: '2026-10-07', to: '2026-10-07' }).length, 1);
  assert.equal(filterRecords(read(), { keyword: '', tags: ['unknown'], from: '', to: '' }).length, 0);
  assert.equal(filterRecords(read(), { keyword: '', tags: [], from: '', to: '2026-10-06' }).length, 0);
});
test('toggles nested and root tasks without touching examples in fenced code', () => {
  assert.match(toggleRecordTask(read()[0], 0, true), /  - \[x\] Nested task/);
  assert.equal(toggleRecordTask(read()[1], 0, false), '- [ ] Done #work');
  const record = read('## Daily Record\n- 10:00 Context\n  ```md\n  - [ ] Example\n  ```\n  - [ ] Actual\n')[0];
  assert.match(toggleRecordTask(record, 0, true), /Example\n  ```\n  - \[x\] Actual/);
});
test('leading Markdown blocks retain valid daily note syntax and round trip', () => {
  for (const text of ['- [ ] One\n- [ ] Two', '```js\nconst x = 1;\n```', '> Quote', '# Heading']) {
    const entry = formatCaptureEntry('record', text, '10:00');
    assert.equal(read(`## Daily Record\n${entry}\n`)[0].text, text);
  }
});
test('does not mistake inline code, URLs or fenced examples for tags', () => {
  assert.deepEqual(recordTags('Keep #work `#example` https://example.org/#anchor\n```\n#fake\n```\n#计划'), ['work', '计划']);
});
test('preserves completed task state and CRLF when editing', () => {
  const record = read()[1];
  const result = replaceCaptureRecord(content.replace(/\n/g, '\r\n'), record, 'Daily Record', revisedRecord(record, 'Changed'));
  assert.match(result, /- \[x\] Changed\r\n/); assert.ok(!/(?<!\r)\n/.test(result));
});
test('repository includes only daily files, supports custom names, refreshes edits and renames', async () => {
  const { app } = memoryApp();
  await app.vault.create(path, content);
  await app.vault.create('Journal/2026/Weekly/2026-W41.md', content);
  const repo = new CaptureRepository(app, settings);
  assert.equal((await repo.list()).length, 2);
  const first = (await repo.list())[0]; await repo.replace(first, null);
  assert.equal((await repo.list()).length, 1);
  const custom = { ...settings, dailyNoteFormat: '[Daily-]DD-MM-YYYY' };
  await app.vault.create('Journal/2026/Daily/10/Daily-07-10-2026.md', content);
  assert.equal((await new CaptureRepository(app, custom).list()).length, 2);
});

test('quick capture translations cover every supported workspace language', async () => {
  const { captureMessages } = await import('./messages.ts');
  const { WORKSPACE_LANGUAGES } = await import('../onboarding/locale.ts');
  const keys = Object.keys(captureMessages('en')).sort();
  for (const locale of Object.keys(WORKSPACE_LANGUAGES)) {
    const messages = captureMessages(locale);
    assert.deepEqual(Object.keys(messages).sort(), keys);
    assert.ok(Object.values(messages).every((text) => typeof text === 'string' && text.trim()));
    if (locale !== 'en') assert.notEqual(messages.title, captureMessages('en').title);
  }
});

test('editing preserves existing block references without showing them in the composer', () => {
  for (const raw of ['- 10:00 First ^capture-id\n  Context', '- 10:00 First\n  Context ^capture-id']) {
    const record = read(`## Daily Record\n${raw}\n`)[0];
    assert.equal(record.text, 'First\nContext');
    const updated = revisedRecord(record, 'Revised\nStill linked');
    assert.equal(updated.split('^capture-id').length, 2);
    assert.equal(updated.split('\n')[record.blockIdFirst ? 0 : 1].endsWith(' ^capture-id'), true);
  }
});

test('repository invalidation during an asynchronous read cannot poison the cache', async () => {
  const { app, state } = memoryApp();
  const file = await app.vault.create(path, '## Daily Record\n- 10:00 Old\n');
  const repo = new CaptureRepository(app, settings);
  let finish!: (text: string) => void;
  const originalRead = state.vault.cachedRead;
  state.vault.cachedRead = () => new Promise((resolve) => { finish = resolve; });
  const reading = repo.list();
  await app.vault.process(file, () => '## Daily Record\n- 10:00 New\n');
  repo.invalidate(file.path);
  finish('## Daily Record\n- 10:00 Old\n'); await reading;
  state.vault.cachedRead = originalRead;
  assert.equal((await repo.list())[0].text, 'New');
});

test('attachment paths respect the host API and support older hosts without overwriting files', async () => {
  const { captureAttachmentPath } = await import('./attachments.ts');
  const { app, state } = memoryApp();
  assert.equal(await captureAttachmentPath(app, 'image.png', path), 'LifeOS Attachments/image.png');
  await app.vault.create('LifeOS Attachments/image.png', 'Original');
  await app.vault.create('LifeOS Attachments/image-1.png', 'Original');
  assert.equal(await captureAttachmentPath(app, 'image.png', path), 'LifeOS Attachments/image-2.png');
  (state.fileManager as unknown as { getAvailablePathForAttachment: (name: string, source: string) => Promise<string> }).getAvailablePathForAttachment = async (name, source) => { assert.equal(source, path); return `Configured/${name}`; };
  assert.equal(await captureAttachmentPath(app, 'image.png', path), 'Configured/image.png');
  const another = memoryApp(); await another.app.vault.create('LifeOS Attachments', 'Keep');
  await assert.rejects(captureAttachmentPath(another.app, 'image.png', path), /unavailable/);
});

test('editing older records without timestamps keeps leading blocks readable', () => {
  const record = read('## Daily Record\n- Older record\n')[0];
  const entry = revisedRecord(record, '- [ ] A new checklist');
  assert.equal(read(`## Daily Record\n${entry}\n`)[0].text, '- [ ] A new checklist');
  assert.equal(revisedRecord(record, 'Updated plain text'), '- Updated plain text');
});

test('task content keeps user-entered times and ignores empty task placeholders', () => {
  const records = read('## Daily Record\n- [ ] 08:30 Call\n- [ ] \n- [ ]\n');
  assert.equal(records.length, 1);
  assert.equal(records[0].text, '08:30 Call');
  assert.equal(revisedRecord(records[0], '08:30 Call back'), '- [ ] 08:30 Call back');
});

test('historically ambiguous blocks cannot target another copy after deletion', () => {
  const text = '## Daily Record\n- 10:00 Duplicate\n- 10:00 Duplicate\n';
  const record = read(text)[0];
  assert.throws(() => replaceCaptureRecord('## Daily Record\n- 10:00 Duplicate\n', record, 'Daily Record', '- Updated'), CaptureConflict);
});

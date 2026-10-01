import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPeriodicFilePath, isInPeriodicNote, isInPeriodicNotesFolder, joinVaultPath } from './paths.ts';

const daily = '2026/Daily/10/2026-10-01.md';

test('root and trailing separators produce vault-relative paths', () => {
  assert.equal(joinVaultPath('/', 'Templates', 'Daily.md'), 'Templates/Daily.md');
  assert.equal(buildPeriodicFilePath('/', '2026', 'Daily', '2026-10-01', '10'), daily);
  assert.equal(buildPeriodicFilePath('PeriodicNotes/', '2026', 'Daily', '2026-10-01', '10'), `PeriodicNotes/${daily}`);
  assert.equal(buildPeriodicFilePath('/', '2026', 'Weekly', '2026-W40'), '2026/Weekly/2026-W40.md');
  assert.equal(buildPeriodicFilePath('/', '2026', 'Monthly', '2026-10'), '2026/Monthly/2026-10.md');
  assert.equal(buildPeriodicFilePath('/', '2026', 'Quarterly', '2026-Q4'), '2026/Quarterly/2026-Q4.md');
  assert.equal(buildPeriodicFilePath('/', '2026', 'Yearly', '2026'), '2026/2026.md');
});

test('recognition matches a complete path and literal md extension', () => {
  assert.equal(isInPeriodicNote(daily, { periodicNotesPath: '/' }), true);
  for (const path of [`Archive/${daily}`, 'Archive2026/2026.md', daily.replace('.md', 'xmd')]) {
    assert.equal(isInPeriodicNote(path, { periodicNotesPath: '/' }), false, path);
  }
  assert.equal(isInPeriodicNote(`Journal (v2)/${daily}`, { periodicNotesPath: 'Journal (v2)/' }), true);
  assert.equal(isInPeriodicNote(`PeriodicNotesArchive/${daily}`, { periodicNotesPath: 'PeriodicNotes' }), false);
});

test('empty settings remain disabled while slash means root', () => {
  for (const periodicNotesPath of ['', undefined]) {
    assert.equal(isInPeriodicNote(daily, { periodicNotesPath }), false);
    assert.equal(isInPeriodicNotesFolder(daily, { periodicNotesPath }), false);
  }
  assert.equal(isInPeriodicNotesFolder(undefined, { periodicNotesPath: '/' }), false);
  assert.equal(isInPeriodicNotesFolder(daily, { periodicNotesPath: '/' }), true);
  assert.equal(isInPeriodicNotesFolder(`PeriodicNotesArchive/${daily}`, { periodicNotesPath: 'PeriodicNotes' }), false);
});

test('calendar key finds the actual note rather than a same-named archived file', () => {
  const expected = buildPeriodicFilePath('/', '2026', 'Daily', '2026-10-01', '10');
  const paths = new Set(['Archive/2026-10-01.md', `Archive/${daily}`]);
  assert.equal(paths.has(expected), false);
  paths.add(daily);
  assert.equal(paths.has(expected), true);
  paths.delete(daily);
  assert.equal(paths.has(expected), false);
});

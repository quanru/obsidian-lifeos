import assert from 'node:assert/strict';
import test from 'node:test';
import dayjs from 'dayjs';
import { captureToToday } from './quick-capture.ts';
import { periodicLocation } from '../periodic/calendar.ts';
import { initializeWorkspace } from '../onboarding/workspace.ts';
import { memoryApp, settings } from '../../tests/vault.ts';

test('concurrent captures create one daily note and preserve every entry', async () => {
  const { app, contents } = memoryApp();
  await initializeWorkspace(app, settings, 'periodic', 'en');
  await Promise.all(
    Array.from({ length: 12 }, (_, i) => captureToToday(app, settings, 'en', 'record', `Record ${i}.`)),
  );
  const path = periodicLocation(dayjs(), 'Daily', settings).file;
  const text = contents.get(path)!;
  for (let i = 0; i < 12; i++) assert.equal(text.split(`Record ${i}.`).length - 1, 1);
});

test('missing template reports failure without creating a daily note', async () => {
  const { app, contents } = memoryApp();
  await assert.rejects(captureToToday(app, settings, 'en', 'task', 'Keep this'), /template is unavailable/);
  assert.equal(contents.size, 0);
});

test('capture into an existing note works even after its template was removed', async () => {
  const { app, contents } = memoryApp();
  const path = periodicLocation(dayjs(), 'Daily', settings).file;
  await app.vault.create(path, '# Personal note\n\n## Daily Record\n\n- Existing\n\n## Reflection\n\nKeep me\n');
  await captureToToday(app, settings, 'en', 'task', 'Next step');
  const text = contents.get(path)!;
  assert.match(text, /- Existing\n- \[ \] Next step/);
  assert.ok(text.endsWith('Keep me\n'));
});

test('identical new captures receive distinct standard block references', async () => {
  const { app, contents } = memoryApp();
  await initializeWorkspace(app, settings, 'periodic', 'en');
  await captureToToday(app, settings, 'en', 'record', 'Repeat', false);
  await captureToToday(app, settings, 'en', 'record', 'Repeat', false);
  const text = contents.get(periodicLocation(dayjs(), 'Daily', settings).file)!;
  const ids = Array.from(text.matchAll(/\^capture-([\w-]+)/g), (match) => match[1]);
  assert.equal(ids.length, 2); assert.equal(new Set(ids).size, 2);
});

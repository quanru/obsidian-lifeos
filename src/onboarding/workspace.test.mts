import assert from 'node:assert/strict';
import test from 'node:test';
import {
  initializeWorkspace,
  readWorkspaceProfile,
  removeUntouchedExamples,
  WORKSPACE_PROFILE_PATH,
} from './workspace.ts';
import { getBasicTemplatePlans, getExamplePlan } from './templates.ts';
import { memoryApp, settings } from '../../tests/vault.ts';

test('initialization preserves edited templates and profile, and repairs only missing files', async () => {
  const { app, contents, entries } = memoryApp();
  const initial = await initializeWorkspace(app, settings, 'para', 'en');
  const template = getBasicTemplatePlans(settings, 'para', 'en')[0].path;
  contents.set(template, 'My custom template');
  const profile = contents.get(WORKSPACE_PROFILE_PATH);
  const repeated = await initializeWorkspace(app, settings, 'para', 'en');
  assert.deepEqual(repeated.created, []);
  assert.equal(contents.get(template), 'My custom template');
  assert.equal(contents.get(WORKSPACE_PROFILE_PATH), profile);
  const missing = getBasicTemplatePlans(settings, 'para', 'en')[1].path;
  entries.delete(missing);
  contents.delete(missing);
  const repaired = await initializeWorkspace(app, settings, 'para', 'en');
  assert.deepEqual(repaired.created, [missing]);
  assert.ok(initial.created.length > 5);
  assert.equal((await readWorkspaceProfile(app))?.template, 'para');
});

test('simultaneous setup is serialized and does not fail or duplicate files', async () => {
  const { app } = memoryApp();
  const [a, b] = await Promise.all([
    initializeWorkspace(app, settings, 'periodic', 'en'),
    initializeWorkspace(app, settings, 'periodic', 'en'),
  ]);
  assert.ok(a.created.length > 0);
  assert.equal(b.created.length, 0);
});

test('different locale, different mode and corrupt profiles cannot overwrite a workspace', async () => {
  const { app, contents } = memoryApp();
  await initializeWorkspace(app, settings, 'periodic', 'en');
  const before = [...contents];
  await assert.rejects(initializeWorkspace(app, settings, 'para', 'en'), /different/);
  await assert.rejects(initializeWorkspace(app, settings, 'periodic', 'zh-cn'), /different/);
  assert.deepEqual([...contents], before);
  contents.set(WORKSPACE_PROFILE_PATH, 'broken');
  await assert.rejects(initializeWorkspace(app, settings, 'periodic', 'en'), /invalid/);
});

test('path conflicts are rejected before any templates are written', async () => {
  const { app, contents } = memoryApp();
  await app.vault.create('Journal', 'Existing note');
  await assert.rejects(initializeWorkspace(app, settings, 'para', 'en'), /folder is required/);
  assert.deepEqual([...contents], [['Journal', 'Existing note']]);
});

test('only untouched examples are removed, for all template locales', async () => {
  for (const locale of ['en', 'zh-cn', 'zh-tw']) {
    const { app, contents } = memoryApp();
    await initializeWorkspace(app, settings, 'para', locale);
    const example = getExamplePlan('para', locale);
    contents.set(example.path, example.content + '\nPersonal addition');
    assert.deepEqual((await removeUntouchedExamples(app, 'para', locale)).preserved, [example.path]);
    contents.set(example.path, example.content);
    assert.deepEqual((await removeUntouchedExamples(app, 'para', locale)).removed, [example.path]);
  }
});

test('hidden profile directory conflicts are rejected before creating templates', async () => {
  const { app, contents } = memoryApp();
  await app.vault.create('.lifeos', 'Keep me');
  await assert.rejects(initializeWorkspace(app, settings, 'periodic', 'en'), /\.lifeos is required/);
  assert.deepEqual([...contents], [['.lifeos', 'Keep me']]);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { memoryApp, settings } from '../../tests/vault';
import { prepareQuickCapture } from './quick-start';
import { getBasicTemplatePlans } from './templates';

test('quick start creates only a daily template and tolerates concurrent clicks', async () => {
  const { app, contents } = memoryApp();
  await Promise.all([prepareQuickCapture(app, settings, 'en'), prepareQuickCapture(app, settings, 'en')]);
  const daily = getBasicTemplatePlans(settings, 'periodic', 'en')[0];
  assert.deepEqual([...contents.keys()], [daily.path]);
  assert.equal(contents.get(daily.path), daily.content);
});
test('quick start preserves existing custom daily content', async () => {
  const { app, contents } = memoryApp();
  const daily = getBasicTemplatePlans(settings, 'periodic', 'en')[0];
  await prepareQuickCapture(app, settings, 'en');
  contents.set(daily.path, 'My daily template');
  await prepareQuickCapture(app, settings, 'zh-cn');
  assert.equal(contents.get(daily.path), 'My daily template');
});
test('quick start refuses path conflicts and missing explicit templates without creating notes', async () => {
  const { app, contents } = memoryApp();
  await app.vault.create(settings.periodicNotesPath, 'Existing note');
  await assert.rejects(prepareQuickCapture(app, settings, 'en'), /folder is required/);
  assert.equal(contents.size, 1);
  const clean = memoryApp();
  await assert.rejects(
    prepareQuickCapture(
      clean.app,
      { ...settings, usePeriodicAdvanced: true, periodicNotesTemplateFilePathDaily: 'Custom.md' },
      'en',
    ),
    /configured daily template is missing/,
  );
  assert.equal(clean.contents.size, 0);
});

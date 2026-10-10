import assert from 'node:assert/strict';
import test from 'node:test';
import { settings, memoryApp } from '../../tests/vault';
import { identifyTheme, matchedThemes, applyThemeSelection } from '../capture/theme-model';
import { migrateThemeSettings } from './config';
import { themeCreationPlan, createThemeNote } from './create';
import { getBasicTemplatePlans, getLocalizedWorkspaceSettings } from '../onboarding/templates';
import { initializeWorkspace, readWorkspaceProfile } from '../onboarding/workspace';
import { themeRowFilter } from './query-filter';
import { themeSnapshot } from './catalog';

const plain = { ...settings, usePARANotes: false };
test('plain themes work independently of PARA, respect index settings and exclude templates', () => {
  assert.equal(identifyTheme('Themes/Japanese/README.md', plain)?.kind, 'theme');
  assert.equal(identifyTheme('Projects/Launch/README.md', plain), undefined);
  assert.equal(identifyTheme('Themes/Japanese/README.md', { ...plain, useThemeNotes: false }), undefined);
  assert.equal(
    identifyTheme('Themes/Japanese/README.md', { ...plain, themesTemplateFilePath: 'Themes/Japanese/README.md' }),
    undefined,
  );
  assert.equal(
    identifyTheme('Themes/Japanese/Japanese.md', { ...plain, useThemeAdvanced: true, themeIndexFilename: 'folderName' })
      ?.name,
    'Japanese',
  );
});
test('legacy disabled PARA stays disabled without changing stored paths or defaults', () => {
  assert.deepEqual(migrateThemeSettings({ usePARANotes: false, projectsPath: 'Custom' }), { useThemeNotes: false });
  assert.deepEqual(migrateThemeSettings({ usePARANotes: true }), { useThemeNotes: true });
  assert.deepEqual(migrateThemeSettings({ useThemeNotes: true, usePARANotes: false }), {});
});
test('creation validates path traversal, names, tags, and separate mode templates', () => {
  const fields = { tag: '#learn/japanese', folder: 'Japanese', index: 'Japanese.README.md' };
  assert.equal(themeCreationPlan(plain, 'theme', fields)?.file, 'Themes/Japanese/Japanese.README.md');
  for (const folder of ['../Other', '/Other', 'Other/../Test', 'Bad\\Name'])
    assert.equal(themeCreationPlan(plain, 'theme', { ...fields, folder }), undefined);
  assert.equal(themeCreationPlan(plain, 'theme', { ...fields, index: 'Other.md' }), undefined);
  assert.equal(themeCreationPlan(plain, 'theme', { ...fields, tag: '#a #b' }), undefined);
  assert.equal(
    themeCreationPlan({ ...plain, useThemeAdvanced: true, themesTemplateFilePath: 'Custom.md' }, 'theme', fields)
      ?.templateFile,
    'Custom.md',
  );
});
test('create with built-in template is serialized and a collision never overwrites', async () => {
  const { app, contents } = memoryApp();
  const fields = { tag: '#learn', folder: 'Japanese', index: 'README.md' };
  const results = await Promise.allSettled([
    createThemeNote(app, plain, 'en', 'theme', fields),
    createThemeNote(app, plain, 'en', 'theme', fields),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.ok(contents.get('Themes/Japanese/README.md')?.includes('ThemeListByTag'));
});
test('any-tag association adds only the first tag and retains shared and unrelated tags', () => {
  const catalog = [
    { path: 'Themes/A/README.md', name: 'A', kind: 'theme' as const, tags: ['a', 'b'] },
    { path: 'Themes/B/README.md', name: 'B', kind: 'theme' as const, tags: ['b'] },
  ];
  assert.equal(applyThemeSelection('Text #personal', catalog, [], [catalog[0].path]), '#a\nText #personal');
  assert.equal(matchedThemes('Text #b', catalog).length, 2);
  assert.match(
    applyThemeSelection(
      'Text #b #personal',
      catalog,
      catalog.map((t) => t.path),
      [catalog[1].path],
    ),
    /#b #personal/,
  );
  assert.equal(applyThemeSelection('Text #b', catalog, [catalog[0].path], [catalog[0].path]), 'Text #b');
});
test('theme initialization is idempotent, saves mode, and keeps manual notes', async () => {
  const { app, contents } = memoryApp();
  const configured = getLocalizedWorkspaceSettings(plain, 'en');
  await initializeWorkspace(app, configured, 'theme', 'en');
  assert.equal((await readWorkspaceProfile(app))?.template, 'theme');
  assert.ok(contents.get('Themes/Template.md')?.includes('ThemeListByTag'));
  assert.ok(contents.get('Journal/Templates/Daily.md') === undefined);
  const daily = getBasicTemplatePlans(configured, 'theme', 'en').find((p) => p.path.endsWith('/Daily.md'))!;
  assert.match(contents.get(daily.path)!, /\{\{snapshot:Theme\}\}/);
  assert(!daily.content.includes('Project List'));
  contents.set(daily.path, 'Manual');
  await initializeWorkspace(app, configured, 'theme', 'en');
  assert.equal(contents.get(daily.path), 'Manual');
});
test('tag queries use capture heading boundaries and exclude habit, nested unrelated sections, templates and indexes', async () => {
  const { app, state } = memoryApp();
  const path = 'Journal/2026/Daily/10/2026-10-10.md';
  await app.vault.create(
    path,
    '## Daily Record\n- Keep #learn\n### Other\n- Skip #learn\n## Habits\n- [ ] Skip habit #learn',
  );
  const allowed = await themeRowFilter(app, plain, [path], 'Themes/Learn/README.md');
  assert(allowed({ path, line: 1 }));
  assert(!allowed({ path, line: 3 }));
  assert(!allowed({ path, line: 5 }));
  assert(!allowed({ path: 'Themes/Learn/README.md', line: 1 }));
  assert(!allowed({ path: 'Themes/Template.md', line: 1 }));
});

test('new theme settings messages are complete in all ten workspace languages', async () => {
  const { themeSettingsMessages } = await import('./messages');
  const { WORKSPACE_LANGUAGES } = await import('../onboarding/locale');
  const keys = Object.keys(themeSettingsMessages('en')).sort();
  for (const locale of Object.keys(WORKSPACE_LANGUAGES)) {
    const m = themeSettingsMessages(locale);
    assert.deepEqual(Object.keys(m).sort(), keys);
    assert(Object.values(m).every((value) => typeof value === 'string' && value.trim()));
    if (locale !== 'en') assert.notEqual(m.title, themeSettingsMessages('en').title);
  }
});

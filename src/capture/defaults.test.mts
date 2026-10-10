import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultCaptureDraft, defaultThemePaths, hasCaptureBody } from './defaults.ts';
import { openCaptureHotkeys } from './hotkeys.ts';
import { captureSettingsMessages } from './settings-messages.ts';
import { WORKSPACE_LANGUAGES } from '../onboarding/locale.ts';
import type { CaptureTheme } from './theme-model.ts';

const themes: CaptureTheme[] = [
  { path: 'Projects/Launch/README.md', name: 'Launch', kind: 'project', tags: ['work', 'launch'] },
  { path: 'Areas/Work/README.md', name: 'Work', kind: 'area', tags: ['work'] },
];
test('default paths tolerate old or malformed settings and keep unique paths', () => {
  assert.deepEqual(defaultThemePaths(undefined), []);
  assert.deepEqual(defaultThemePaths('Projects/Launch/README.md'), []);
  assert.deepEqual(defaultThemePaths([null, 3, '', ' a ', 'a']), ['a']);
});
test('new presets use live theme tags, merge shared tags, and skip missing or disabled themes', () => {
  const paths = themes.map((theme) => theme.path).concat('Missing/README.md');
  assert.equal(defaultCaptureDraft(themes, paths), '#work\n');
  assert.equal(defaultCaptureDraft([{ ...themes[0], tags: ['new'] }], paths), '#new\n');
  assert.equal(defaultCaptureDraft([], paths), '');
  assert.equal(defaultCaptureDraft(themes, []), '');
});
test('preset tags and whitespace alone cannot create a record, while content and non-default tags can', () => {
  const preset = defaultCaptureDraft(
    themes,
    themes.map((theme) => theme.path),
  );
  assert.equal(hasCaptureBody(' #work  ', preset), false);
  assert.equal(hasCaptureBody('', preset), false);
  assert.equal(hasCaptureBody('#work #launch\nA thought', preset), true);
  assert.equal(hasCaptureBody('#work #personal', preset), true);
  assert.equal(hasCaptureBody('`#work`', preset), true);
  assert.equal(hasCaptureBody('Thought without themes', preset), true);
});
test('hotkey navigation filters native commands and handles missing host support', () => {
  const calls: string[] = [];
  const app = {
    setting: {
      open: () => calls.push('open'),
      openTabById: (id: string) => {
        calls.push(id);
        return { setQuery: (query: string) => calls.push(query) };
      },
    },
  };
  assert.equal(openCaptureHotkeys(app as never, 'Quick capture'), true);
  assert.deepEqual(calls, ['open', 'hotkeys', 'LifeOS: Quick capture']);
  assert.equal(openCaptureHotkeys({} as never, 'Quick capture'), false);
  assert.equal(
    openCaptureHotkeys(
      {
        setting: {
          open: () => {
            throw new Error('unavailable');
          },
          openTabById: () => undefined,
        },
      } as never,
      'Quick capture',
    ),
    false,
  );
});
test('capture settings provide complete text in all supported languages', () => {
  const keys = Object.keys(captureSettingsMessages('en')).sort();
  for (const locale of Object.keys(WORKSPACE_LANGUAGES)) {
    const m = captureSettingsMessages(locale);
    assert.deepEqual(Object.keys(m).sort(), keys);
    assert.ok(Object.values(m).every((value) => typeof value === 'string' && value.trim().length > 0));
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { captureDateRange, sameCapture } from './interaction.ts';
import { readCaptureRecords } from './history.ts';
import { interactionMessages } from './interaction-messages.ts';
import { WORKSPACE_LANGUAGES } from '../onboarding/locale.ts';

test('date presets include today and cross month/year boundaries using local dates', () => {
  const now = new Date(2026, 0, 2, 12);
  assert.deepEqual(captureDateRange('today', now), { from: '2026-01-02', to: '2026-01-02' });
  assert.deepEqual(captureDateRange('7d', now), { from: '2025-12-27', to: '2026-01-02' });
  assert.deepEqual(captureDateRange('30d', now), { from: '2025-12-04', to: '2026-01-02' });
  assert.deepEqual(captureDateRange('7d', new Date(2024, 2, 2, 12)), { from: '2024-02-25', to: '2024-03-02' });
  assert.deepEqual(captureDateRange('all', now), { from: '', to: '' });
  assert.deepEqual(captureDateRange('custom', now), { from: '', to: '' });
});
test('inline editor survives a changed source block but does not attach to another duplicate', () => {
  const read = (body: string) =>
    readCaptureRecords('## Records\n' + body, 'Journal/2026-01-02.md', '2026-01-02', 'Records');
  const [old] = read('- 10:00 Draft ^capture-a');
  const [changed] = read('- 10:00 Changed ^capture-a');
  assert.equal(sameCapture(old, changed), true);
  assert.equal(sameCapture(old, { ...changed, path: 'Another.md' }), false);
  assert.equal(sameCapture(old, { ...changed, blockId: 'capture-b' }), false);
  const [a, b] = read('- 10:00 Duplicate\n- 10:00 Duplicate');
  assert.equal(sameCapture(a, b), false);
  assert.equal(sameCapture(a, { ...a, line: 99, ambiguous: false }), false);
});
test('interaction labels cover all supported languages without English fallback', () => {
  const keys = Object.keys(interactionMessages('en')).sort();
  for (const locale of Object.keys(WORKSPACE_LANGUAGES)) {
    const messages = interactionMessages(locale);
    assert.deepEqual(Object.keys(messages).sort(), keys);
    assert.ok(Object.values(messages).every((value) => value.trim()));
    if (locale !== 'en') assert.notEqual(messages.copy, interactionMessages('en').copy);
  }
});

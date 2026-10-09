import assert from 'node:assert/strict';
import { test } from 'node:test';
import { recordCursor } from './record-cursor';

test('today cursor stays before the next section, ignoring fake headings', () => {
  const content =
    '---\nexample: |\n  ## Records\n---\n```md\n## Records\n```\n## Records\n- Real note\n\n## Reflection\nKeep me';
  assert.deepEqual(recordCursor(content, 'Records'), { line: 8, ch: 11 });
});
test('today cursor handles CRLF and an empty record section', () => {
  assert.deepEqual(recordCursor('## Records\r\n\r\n## Reflection\r\nKeep me', 'Records'), { line: 1, ch: 0 });
});
test('missing heading falls back to document end without rewriting the note', () => {
  const content = '# Existing note\nKeep me';
  assert.deepEqual(recordCursor(content, 'Records'), { line: 1, ch: 7 });
  assert.equal(content, '# Existing note\nKeep me');
});

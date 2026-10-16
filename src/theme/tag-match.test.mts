import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesThemeTag } from './tag-match';
test('theme items match exact or descendant tags without matching similar prefixes', () => {
  assert(matchesThemeTag(['#Learn/TypeScript'], ['learn']));
  assert(matchesThemeTag(['#other', '#learn'], ['learn']));
  assert(!matchesThemeTag(['#learning'], ['learn']));
  assert(!matchesThemeTag(['#learn'], ['learn/typescript']));
  assert(!matchesThemeTag([], ['learn']));
});

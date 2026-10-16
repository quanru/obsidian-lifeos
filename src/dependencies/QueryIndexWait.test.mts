import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryIndexWait } from './QueryIndexWait';

function fixture(ready = false) {
  const listeners = new Set<() => void>();
  const api = { index: { initialized: ready } };
  const app: any = {
    plugins: { manifests: { dataview: {} }, enabledPlugins: new Set(['dataview']), plugins: { dataview: { api } } },
    metadataCache: {
      on: (_: string, fn: () => void) => {
        listeners.add(fn);
        return { off: () => listeners.delete(fn) };
      },
    },
  };
  let calls = 0;
  const waiter = new QueryIndexWait({} as HTMLElement, app, () => calls++);
  return { waiter, api, listeners, calls: () => calls };
}

test('a query opened during indexing refreshes once and releases its readiness listener', () => {
  const f = fixture();
  f.waiter.load();
  assert.equal(f.calls(), 0);
  f.api.index.initialized = true;
  for (const notify of [...f.listeners]) notify();
  f.waiter.retry();
  assert.equal(f.calls(), 1);
  assert.equal(f.listeners.size, 0);
});

test('closing a waiting query prevents a late refresh', () => {
  const f = fixture();
  f.waiter.load();
  const stale = [...f.listeners][0];
  f.waiter.unload();
  f.api.index.initialized = true;
  stale();
  assert.equal(f.calls(), 0);
  assert.equal(f.listeners.size, 0);
});

test('readiness before listener registration still refreshes the query', () => {
  const f = fixture(true);
  f.waiter.load();
  assert.equal(f.calls(), 1);
  assert.equal(f.listeners.size, 0);
});

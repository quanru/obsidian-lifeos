import assert from 'node:assert/strict';
import test from 'node:test';
import { TaskQuery } from './TaskQuery.ts';

function fixture(render: (el: any, component: any) => Promise<void>) {
  const listeners = new Set<() => void>();
  const container: any = {
    value: undefined,
    ownerDocument: { createElement: () => ({}) },
    replaceChildren(el: any) {
      this.value = el.value;
    },
  };
  const app: any = {
    vault: {
      on: (_: string, callback: () => void) => {
        listeners.add(callback);
        return { off: () => listeners.delete(callback) };
      },
    },
    metadataCache: {
      on: (_: string, callback: () => void) => {
        listeners.add(callback);
        return { off: () => listeners.delete(callback) };
      },
    },
  };
  const query = new TaskQuery(container, app, render, (el) => {
    (el as any).value = 'error';
  });
  return { query, container, listeners };
}

test('queries current task states after completion and reopening, and releases listeners on unload', async () => {
  let checked = false;
  const { query, container, listeners } = fixture(async (el) => {
    el.value = checked;
  });
  query.load();
  await query.refresh();
  assert.equal(container.value, false);
  checked = true;
  for (const callback of listeners) callback();
  await query.refresh();
  assert.equal(container.value, true);
  checked = false;
  for (const callback of listeners) callback();
  await query.refresh();
  assert.equal(container.value, false);
  query.unload();
  assert.equal(listeners.size, 0);
});

test('an index change during a slow render discards stale output and unloads superseded children', async () => {
  let release: () => void;
  let calls = 0;
  let disposed = 0;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const { query, container, listeners } = fixture(async (el, component) => {
    const call = ++calls;
    component.onunload = () => disposed++;
    if (call === 1) await gate;
    el.value = call;
  });
  query.load();
  for (const callback of listeners) callback();
  const pending = query.refresh();
  release!();
  await pending;
  assert.equal(calls, 2);
  assert.equal(container.value, 2);
  assert.equal(disposed, 1);
  query.unload();
  assert.equal(disposed, 2);
});

test('unloading during an awaited query cannot repopulate the detached view', async () => {
  let release: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const { query, container } = fixture(async (el) => {
    await gate;
    el.value = 'late';
  });
  query.load();
  const pending = query.refresh();
  query.unload();
  release!();
  await pending;
  assert.equal(container.value, undefined);
});

test('a failed query can recover on the next index change', async () => {
  let fail = true;
  const { query, container } = fixture(async (el) => {
    if (fail) throw new Error('query failed');
    el.value = 'recovered';
  });
  query.load();
  await query.refresh();
  assert.equal(container.value, 'error');
  fail = false;
  await query.refresh();
  assert.equal(container.value, 'recovered');
  query.unload();
});

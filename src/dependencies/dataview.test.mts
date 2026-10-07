import assert from 'node:assert/strict';
import test from 'node:test';
import { memoryApp } from '../../tests/vault.ts';
import { dataviewState, waitForDataview } from './dataview.ts';

test('distinguishes missing, disabled, indexing and ready Dataview', async () => {
  const { app, state, events } = memoryApp();
  assert.equal(dataviewState(app), 'missing');
  await assert.rejects(
    waitForDataview(app, () => 'Install Dataview'),
    /Install Dataview/,
  );
  state.plugins.manifests.dataview = {};
  assert.equal(dataviewState(app), 'disabled');
  state.plugins.enabledPlugins.add('dataview');
  assert.equal(dataviewState(app), 'indexing');
  state.plugins.plugins.dataview = { api: { index: { initialized: false } } };
  assert.equal(dataviewState(app), 'indexing');
  const waiting = waitForDataview(app, () => 'Still indexing', 100);
  const api = { index: { initialized: true } };
  state.plugins.plugins.dataview = { api };
  for (const callback of events.values()) callback();
  assert.equal(await waiting, api);
  assert.equal(events.size, 0);
  assert.equal(dataviewState(app), 'ready');
});

test('index timeout rejects with guidance and removes the event listener', async () => {
  const { app, state, events } = memoryApp();
  state.plugins.manifests.dataview = {};
  state.plugins.enabledPlugins.add('dataview');
  await assert.rejects(
    waitForDataview(app, () => 'Retry after indexing', 5),
    /Retry after indexing/,
  );
  assert.equal(events.size, 0);
});

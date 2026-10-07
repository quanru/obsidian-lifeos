import type { App } from 'obsidian';
import type { DataviewApi } from 'obsidian-dataview';
import { getAPI, isPluginEnabled } from 'obsidian-dataview';

export type DataviewState = 'missing' | 'disabled' | 'indexing' | 'ready';

export function dataviewState(app: App): DataviewState {
  const plugins = (app as App & { plugins: { manifests: Record<string, unknown> } }).plugins;
  if (!plugins?.manifests?.dataview) return 'missing';
  if (!isPluginEnabled(app)) return 'disabled';
  return getAPI(app)?.index?.initialized ? 'ready' : 'indexing';
}

export function waitForDataview(app: App, message: () => string, timeoutMs = 15000): Promise<DataviewApi> {
  const api = getAPI(app);
  if (api && dataviewState(app) === 'ready') return Promise.resolve(api);
  if (dataviewState(app) !== 'indexing') return Promise.reject(new Error(message()));
  return new Promise((resolve, reject) => {
    const finish = () => {
      const ready = getAPI(app);
      if (!ready || dataviewState(app) !== 'ready') return;
      clearTimeout(timeout);
      app.metadataCache.offref(event);
      resolve(ready);
    };
    const event = app.metadataCache.on('dataview:index-ready' as 'changed', finish);
    const timeout = setTimeout(() => {
      app.metadataCache.offref(event);
      reject(new Error(message()));
    }, timeoutMs);
    finish();
  });
}

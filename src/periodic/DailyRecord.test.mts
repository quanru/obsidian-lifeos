import assert from 'node:assert/strict';
import test from 'node:test';
import type { RequestUrlParam, RequestUrlResponse } from 'obsidian';
import { setRequestUrlMock } from '../../tests/obsidian';
import { memoryApp, settings as vaultSettings } from '../../tests/vault';
import type { PluginSettings } from '../type';
import { DailyRecord } from './DailyRecord';
import type { File } from './File';

const originalCheckpoint = '1767225600000';
const key = 'lifeos-daily-record-last-time-test-token';
const note = 'Journal/2026/Daily/01/2026-01-02.md';
const first = { content: 'first memo', createTime: '2026-01-02T12:00:00Z', updateTime: '2026-01-02T12:00:00Z' };
const second = { content: 'second memo', createTime: '2026-01-02T11:00:00Z', updateTime: '2026-01-02T11:00:00Z' };
function response(json: unknown, status = 200, arrayBuffer = new ArrayBuffer(0)): RequestUrlResponse {
  return { json, status, text: JSON.stringify(json), headers: {}, arrayBuffer };
}
const requestError = (status: number) => Object.assign(new Error(`Request failed, status ${status}`), { status });

async function fixture(handler: (url: URL, options: RequestUrlParam) => RequestUrlResponse) {
  const checkpoints = new Map([[key, originalCheckpoint]]);
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => checkpoints.get(key),
        setItem: (key: string, value: string) => checkpoints.set(key, value),
      },
    },
  });
  const { app, state, contents } = memoryApp();
  const binaries = new Map<string, ArrayBuffer>();
  state.vault.adapter.writeBinary = async (path, data) => {
    binaries.set(path, data);
  };
  await app.vault.create(note, '# Existing local note\n\n## Daily Record\n- local prose\n\n## Footer\nKeep this.\n');
  const file = { get: (link: string) => app.vault.getAbstractFileByPath(`Journal/${link}`) } as File;
  const settings = {
    ...vaultSettings,
    dailyRecordAPI: 'https://memos.example',
    dailyRecordToken: 'test-token',
    dailyRecordHeader: '## Daily Record',
  } as PluginSettings;
  setRequestUrlMock(async (options) => handler(new URL(options.url), options));
  return { checkpoints, contents, binaries, settings, create: () => new DailyRecord(app, settings, file, 'en-US') };
}

for (const failingPage of [1, 2]) {
  test(`preserves persisted checkpoint after page ${failingPage} fails and imports on restart`, async () => {
    let failing = true;
    const f = await fixture((url) => {
      if (url.pathname === '/api/instance/profile') {
        if (failingPage === 1) return response({ message: 'absent' }, 404);
        return {
          ...response(null),
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          text: '<!doctype html><!-- memos.metadata.head --><title>Memos</title>',
          get json() {
            throw new SyntaxError('Not JSON');
          },
        };
      }
      if (url.pathname === '/api/v1/instance/profile') return response({ version: '0.28.0', owner: 'users/77' });
      if (url.pathname === '/api/v1/auth/me') return response({ user: { name: 'users/2' } });
      if (url.pathname === '/api/v1/attachments') return response({ attachments: [] });
      if (url.pathname === '/api/v1/memos') {
        const later = Boolean(url.searchParams.get('pageToken'));
        if (failing && (later ? 2 : 1) === failingPage) throw requestError(503);
        return response(later ? { memos: [second], nextPageToken: '' } : { memos: [first], nextPageToken: 'next' });
      }
      assert.fail(url.href);
    });
    await f.create().sync();
    assert.equal(f.checkpoints.get(key), originalCheckpoint);
    failing = false;
    await f.create().sync();
    assert.notEqual(f.checkpoints.get(key), originalCheckpoint);
    const content = f.contents.get(note)!;
    assert.equal(content.match(/first memo/g)?.length, 1);
    assert.equal(content.match(/second memo/g)?.length, 1);
    assert.match(content, /local prose/);
    assert.match(content, /## Footer\nKeep this/);
    await f.create().forceSync();
    assert.equal(f.contents.get(note), content);
  });
}

for (const version of ['26.11.1', '26.11.2']) {
  test(`syncs Memos ${version} through a reverse proxy and skips comment-only pages`, async () => {
    let visited = 0;
    const f = await fixture((url, options) => {
      assert.equal(options.headers?.Authorization, 'Bearer test-token');
      if (url.pathname === '/memos/proxy/api/instance/profile') return response({ version, owner: 'users/77' });
      if (url.pathname === '/memos/proxy/api/auth/me') return response({ user: { name: 'users/2' } });
      if (url.pathname === '/memos/proxy/api/memos') {
        visited++;
        assert.equal(
          url.searchParams.get('filter'),
          "creator == 'users/2'" + (version === '26.11.2' ? ' && parent == null' : ''),
        );
        assert.equal(url.searchParams.get('state'), 'NORMAL');
        return response(
          url.searchParams.get('pageToken') === 'after-comment'
            ? { memos: [first], nextPageToken: '' }
            : {
                memos: [{ ...second, content: 'must not import', parent: 'memos/parent' }],
                nextPageToken: 'after-comment',
              },
        );
      }
      assert.fail(url.href);
    });
    f.settings.dailyRecordAPI =
      version === '26.11.1' ? 'https://memos.example/memos/proxy/' : 'https://memos.example/memos/proxy/api/v1/memos';
    f.contents.set(note, '## Daily Record\n\n- local line\n\n## Other\nKeep this.\n');
    await f.create().sync();
    assert.equal(visited, 2);
    assert.match(f.contents.get(note)!, /first memo/);
    assert.match(f.contents.get(note)!, /local line/);
    assert.match(f.contents.get(note)!, /## Other\nKeep this/);
    assert.doesNotMatch(f.contents.get(note)!, /must not import/);
  });
}

test('does not fall back to another endpoint on permission or transient errors', async () => {
  for (const status of [401, 403, 503]) {
    for (const deniedPath of ['/api/instance/profile', '/api/auth/me']) {
      const routes: string[] = [];
      const f = await fixture((url) => {
        routes.push(url.pathname);
        if (url.pathname === deniedPath) return response({ message: 'not available' }, status);
        if (url.pathname === '/api/instance/profile') return response({ version: '26.11.2', owner: 'users/77' });
        assert.fail(url.href);
      });
      await f.create().sync();
      assert.deepEqual(
        routes,
        deniedPath === '/api/instance/profile' ? ['/api/instance/profile'] : ['/api/instance/profile', '/api/auth/me'],
      );
      assert.equal(f.checkpoints.get(key), originalCheckpoint);
    }
  }
});

test('keeps the previous checkpoint on a malformed successful response or repeated cursor', async () => {
  for (const result of [{ unexpected: [] }, { memos: [first], nextPageToken: 'cycle' }]) {
    let requests = 0;
    const f = await fixture((url) => {
      if (url.pathname === '/api/instance/profile') return response({ version: '26.11.2' });
      if (url.pathname === '/api/auth/me') return response({ user: { name: 'users/2' } });
      if (url.pathname === '/api/memos') {
        requests++;
        assert.ok(requests <= 2);
        return response(result);
      }
      assert.fail(url.href);
    });
    await f.create().sync();
    assert.equal(f.checkpoints.get(key), originalCheckpoint);
    assert.equal(requests, 'memos' in result ? 2 : 1);
  }
});

test('does not advance the checkpoint when a modern memo attachment fails to download', async () => {
  let attachments = 0;
  const f = await fixture((url) => {
    if (url.pathname === '/api/instance/profile') return response({ version: '26.11.2' });
    if (url.pathname === '/api/auth/me') return response({ user: { name: 'users/2' } });
    if (url.pathname === '/api/memos') {
      return response({
        memos: [{ ...first, attachments: [{ name: 'attachments/top', filename: 'proof.json' }] }],
        nextPageToken: '',
      });
    }
    if (url.pathname === '/file/attachments/top') {
      attachments++;
      return response({ message: 'temporary attachment failure' }, 503);
    }
    assert.fail(url.href);
  });
  await f.create().sync();
  assert.equal(attachments, 1);
  assert.equal(f.checkpoints.get(key), originalCheckpoint);
  assert.doesNotMatch(f.contents.get(note)!, /first memo/);
});

test('does not mistake another web page for the Memos SPA fallback', async () => {
  const routes: string[] = [];
  const f = await fixture((url) => {
    routes.push(url.pathname);
    assert.equal(url.pathname, '/api/instance/profile');
    return {
      ...response(null),
      headers: { 'content-type': 'text/html;charset=utf-8' },
      text: '<!doctype html><title>Sign in</title>',
      get json() {
        throw new SyntaxError('Not JSON');
      },
    };
  });
  await f.create().sync();
  assert.deepEqual(routes, ['/api/instance/profile']);
  assert.equal(f.checkpoints.get(key), originalCheckpoint);
});

test('saves the linked binary for a memo with an attachment and no text', async () => {
  const data = Uint8Array.of(11, 22, 33).buffer;
  const f = await fixture((url) => {
    if (url.pathname === '/api/instance/profile') return response({ version: '26.11.2' });
    if (url.pathname === '/api/auth/me') return response({ user: { name: 'users/2' } });
    if (url.pathname === '/api/memos') {
      const attachmentOnly = { createTime: first.createTime, updateTime: first.updateTime };
      return response({
        memos: [{ ...attachmentOnly, attachments: [{ name: 'attachments/uid', filename: 'proof with spaces.json' }] }],
        nextPageToken: '',
      });
    }
    if (url.pathname === '/file/attachments/uid') return response(null, 200, data);
    assert.fail(url.href);
  });
  await f.create().sync();
  assert.equal(f.binaries.get('Journal/Attachments/uid-proof with spaces.json'), data);
  assert.match(f.contents.get(note)!, /!\[\[uid-proof with spaces\.json\]\]/);
  assert.notEqual(f.checkpoints.get(key), originalCheckpoint);
});

test('persists sync start, not the time a later page finished', async (t) => {
  const started = Date.UTC(2026, 0, 3, 1, 0, 0, 750);
  let current = started;
  t.mock.method(Date, 'now', () => current);
  let requestCount = 0;
  const f = await fixture((url) => {
    if (url.pathname === '/api/instance/profile') return response({ version: '26.11.2' });
    if (url.pathname === '/api/auth/me') return response({ user: { name: 'users/2' } });
    if (url.pathname === '/api/memos') {
      requestCount++;
      current = started + 10_000;
      return response({ memos: [], nextPageToken: '' });
    }
    assert.fail(url.href);
  });
  const client = f.create();
  await client.sync();
  assert.equal(requestCount, 1);
  assert.equal(f.checkpoints.get(key), String(started));
  assert.equal(client.lastTime, String(started));
});

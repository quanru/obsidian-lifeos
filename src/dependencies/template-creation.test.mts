import assert from 'node:assert/strict';
import test from 'node:test';
import { createFile } from '../util.ts';
import { memoryApp } from '../../tests/vault.ts';

const options = {
  locale: 'en',
  templateFile: 'Templates/Daily.md',
  folder: 'Journal/2026/Daily/10',
  file: 'Journal/2026/Daily/10/2026-10-08.md',
};

test('Templater creation is awaited before writing tags and opening the target note', async () => {
  const { app, state } = memoryApp();
  const template = await app.vault.create(options.templateFile, '<% tp.file.title %>');
  const actions: string[] = [];
  (state.plugins.plugins as any)['templater-obsidian'] = {
    templater: {
      async create_new_note_from_template(input, folder, filename, openNew) {
        assert.equal(input, template);
        assert.equal(folder, options.folder);
        assert.equal(filename, '2026-10-08');
        assert.equal(openNew, false);
        actions.push('parse');
        await new Promise((resolve) => setTimeout(resolve, 5));
        const target = await app.vault.create(options.file, '# 2026-10-08');
        actions.push('parsed');
        return target;
      },
    },
  };
  state.plugins.enabledPlugins.add('templater-obsidian');
  state.fileManager.processFrontMatter = async (_file: any, update: any) => {
    actions.push('tag');
    const frontmatter = { tags: 'existing' };
    update(frontmatter);
    assert.deepEqual(frontmatter.tags, ['existing', 'work']);
  };
  state.workspace.getLeaf = () => ({
    openFile: async () => {
      actions.push('open');
    },
  });
  const file = await createFile(app, { ...options, tag: '#work' });
  assert.equal(file?.path, options.file);
  assert.deepEqual(actions, ['parse', 'parsed', 'tag', 'open']);
  assert.equal(await app.vault.read(file!), '# 2026-10-08');
});

test('plain templates, missing or disabled Templater preserve their text without unnecessary frontmatter writes', async () => {
  for (const [enabled, content] of [
    [false, '<% tp.file.title %>'],
    [true, '# Plain note'],
  ] as const) {
    const { app, state } = memoryApp();
    await app.vault.create(options.templateFile, content);
    if (enabled) state.plugins.enabledPlugins.add('templater-obsidian');
    (state.plugins.plugins as any)['templater-obsidian'] = {
      templater: {
        create_new_note_from_template: () => {
          throw new Error('Must not run');
        },
      },
    };
    state.fileManager.processFrontMatter = async () => {
      throw new Error('Must not rewrite frontmatter without a tag');
    };
    const file = await createFile(app, options);
    assert.equal(await app.vault.read(file!), content);
  }
});

test('failed Templater parsing is not reported as successful and an existing daily note is never parsed again', async () => {
  const { app, state } = memoryApp();
  await app.vault.create(options.templateFile, '<% invalid() %>');
  let calls = 0;
  state.plugins.enabledPlugins.add('templater-obsidian');
  (state.plugins.plugins as any)['templater-obsidian'] = {
    templater: {
      create_new_note_from_template: async () => {
        calls++;
        return undefined;
      },
    },
  };
  await assert.rejects(createFile(app, options), /Templater could not create note/);
  assert.equal(app.vault.getAbstractFileByPath(options.file), null);
  const existing = await app.vault.create(options.file, 'Keep my journal');
  assert.equal(await createFile(app, options), existing);
  assert.equal(calls, 1);
});

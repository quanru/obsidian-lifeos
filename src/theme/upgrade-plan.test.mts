import assert from 'node:assert/strict';
import test from 'node:test';
import { planThemeUpgrade, applyThemeUpgrade } from './upgrade-plan';
const fence = (name: string, language = 'LifeOS') => `\`\`\`${language}\n${name}\n\`\`\``;

test('upgrades standard plain/PARA queries while preserving custom layout and handwritten content', () => {
  const text = `---\ntags: [work]\n---\n# My layout\nManual text\n${fence('TaskListByTag')}\n${fence('BulletListByTag', 'PeriodicPARA')}\n${fence('FileListByTag', 'LifeOSOpen')}\n${fence('ProjectListByTag')}\n${fence('custom code')}\nTail`;
  const plan = planThemeUpgrade(text);
  assert.equal(plan.length, 2);
  const upgraded = applyThemeUpgrade(text, plan);
  assert.equal(
    upgraded,
    text
      .replace(fence('TaskListByTag'), fence('TaskOpenListByTag', 'LifeOSOpen'))
      .replace(fence('BulletListByTag', 'PeriodicPARA'), fence('BulletListByTag', 'LifeOSOpen')),
  );
  assert.equal(planThemeUpgrade(upgraded).length, 0);
});
test('preserves CRLF, blank lines, indentation and tilde fences', () => {
  const text = 'Header\r\n  ~~~~PeriodicPARA\r\n\r\nTaskListByTag\r\n\r\n  ~~~~\r\nTail';
  assert.equal(
    applyThemeUpgrade(text, planThemeUpgrade(text)),
    text.replace('PeriodicPARA', 'LifeOSOpen').replace('TaskListByTag', 'TaskOpenListByTag'),
  );
});
test('does not rewrite code examples, frontmatter, custom parameters or incomplete fences', () => {
  for (const text of [
    `---\nexample: |\n  ${fence('TaskListByTag')}\n---`,
    `\`\`\`\`markdown\n${fence('TaskListByTag')}\n\`\`\`\``,
    fence('TaskListByTag\ncustom option'),
    fence('__proto__'),
    fence('constructor'),
    '> ```LifeOS\n> TaskListByTag\n> ```',
    '```LifeOS\nTaskListByTag',
    '```dataview\nTASK\n```',
  ])
    assert.equal(planThemeUpgrade(text).length, 0);
});
test('applies only selected blocks and rejects a changed preview range', () => {
  const text = `${fence('TaskListByTag')}\n${fence('BulletListByTag')}`;
  const changes = planThemeUpgrade(text);
  assert.equal(planThemeUpgrade(applyThemeUpgrade(text, [changes[1]])).length, 1);
  assert.throws(() => applyThemeUpgrade('Edited\n' + text, changes), /stale-theme-upgrade/);
});

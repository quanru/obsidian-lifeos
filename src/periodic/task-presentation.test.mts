import assert from 'node:assert/strict';
import test from 'node:test';
import { captureTaskText, presentCaptureTask } from './task-presentation.ts';

const id = '^capture-d747fca0-99d4-4a26-97e1-afb26e183a80';

test('capture references on the first line of multiline tasks are hidden without changing tags or content', () => {
  assert.equal(captureTaskText(`#learning ${id}\nRead one page`), '#learning\nRead one page');
  assert.equal(captureTaskText(`Read one page ${id}\r\nNext step`), 'Read one page\r\nNext step');
  assert.equal(captureTaskText(`Read [[Note#${id}]] and \`${id}\``), `Read [[Note#${id}]] and \`${id}\``);
  assert.equal(captureTaskText(`\`\`\`md\nExample ${id}\n\`\`\``), `\`\`\`md\nExample ${id}\n\`\`\``);
  assert.equal(captureTaskText('Keep ^user-block'), 'Keep ^user-block');
});

test('task presentation retains original text and positions needed for writeback, including nested tasks', () => {
  const child = { text: `Child ${id}`, path: 'Daily.md', line: 4, children: [] };
  const task = { text: `Parent ${id}`, path: 'Daily.md', line: 3, children: [child] };
  const result = presentCaptureTask(task as never) as typeof task & { visual: string };
  assert.equal(result.text, task.text);
  assert.equal(result.visual, 'Parent');
  assert.equal(result.path, task.path);
  assert.equal(result.line, task.line);
  assert.equal(result.children[0].text, child.text);
  assert.equal((result.children[0] as typeof child & { visual: string }).visual, 'Child');
  assert.equal('visual' in task, false);
  assert.equal('visual' in child, false);
});

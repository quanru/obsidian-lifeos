import { build } from 'esbuild';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
async function testFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await testFiles(target)));
    else if (entry.name.endsWith('.test.mts')) files.push(target);
  }
  return files;
}
const directory = await mkdtemp(path.join(tmpdir(), 'lifeos-oss-tests-'));
try {
  const inputs = await testFiles(path.join(root, 'src'));
  if (!inputs.length) throw new Error('No test files found.');
  const outputs = [];
  for (const [index, input] of inputs.entries()) {
    const outfile = path.join(directory, `${index}.test.cjs`);
    await build({
      entryPoints: [input],
      outfile,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node22',
      alias: { obsidian: path.join(root, 'tests/obsidian.ts') },
      logLevel: 'warning',
    });
    outputs.push(outfile);
  }
  const child = spawn(process.execPath, ['--test', '--test-concurrency=2', ...outputs], { stdio: 'inherit' });
  process.exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', resolve);
  });
} finally {
  await rm(directory, { recursive: true, force: true });
}

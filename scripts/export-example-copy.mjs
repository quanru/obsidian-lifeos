// Exports only OSS starter content. Does not read Pro resources or real vaults.
import { build } from 'esbuild';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const directory = await mkdtemp(path.join(tmpdir(), 'lifeos-example-copy-'));
try {
  const output = path.join(directory, 'copy.cjs');
  await build({
    stdin: {
      contents: `export * from './src/onboarding/templates'; export * from './src/onboarding/locale'; export * from './src/feature-i18n';`,
      resolveDir: process.cwd(),
    },
    outfile: output,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    logLevel: 'warning',
  });
  const api = createRequire(import.meta.url)(output);
  const languages = {};
  for (const [locale, label] of Object.entries(api.WORKSPACE_LANGUAGES)) {
    const settings = api.getLocalizedWorkspaceSettings(
      {
        usePeriodicNotes: true,
        usePARANotes: true,
        useDailyRecord: false,
        weekStart: -1,
        paraIndexFilename: 'readme',
        onboardingVersion: 1,
      },
      locale,
    );
    languages[locale] = {
      label,
      settings,
      copy: { ...api.getFeatureI18n(locale) },
      plans: api.getBasicTemplatePlans(settings, 'para', locale, { includeGuide: true, includeExample: true }),
    };
    delete languages[locale].copy.setupSuccess;
  }
  await writeFile(process.argv[2], JSON.stringify({ schemaVersion: 1, languages }, null, 2) + '\n');
} finally {
  await rm(directory, { recursive: true, force: true });
}

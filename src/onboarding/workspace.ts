import { WORKSPACE_LANGUAGES } from './locale';
import { type App, TFile, TFolder, normalizePath } from 'obsidian';
import { withVaultLock } from '../vault-lock';
import type { PluginSettings } from '../type';
import {
  type WorkspaceLocale,
  type WorkspaceMode,
  getBasicTemplatePlans,
  getExamplePlan,
  getStartHerePlan,
  normalizeWorkspaceLocale,
} from './templates';

export const WORKSPACE_PROFILE_PATH = '.lifeos/template-profile.json';

export type WorkspaceProfile = {
  schemaVersion: 1;
  template: WorkspaceMode;
  locale: WorkspaceLocale;
  initializedAt: string;
};

export type WorkspaceSetupResult = {
  created: string[];
  skipped: string[];
  startPath: string;
  examplePaths: string[];
};

async function ensureFolder(app: App, folderPath: string, result: WorkspaceSetupResult): Promise<void> {
  const normalized = normalizePath(folderPath);
  if (!normalized || normalized === '/') return;

  const segments = normalized.split('/').filter(Boolean);
  let currentPath = '';

  for (const segment of segments) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    const existing = app.vault.getAbstractFileByPath(currentPath);

    if (existing instanceof TFolder) continue;
    if (existing) throw new Error(`A file already exists where a folder is required: ${currentPath}`);

    await app.vault.createFolder(currentPath);
    result.created.push(currentPath);
  }
}

async function initializeWorkspaceUnlocked(
  app: App,
  settings: PluginSettings,
  mode: WorkspaceMode,
  locale?: string,
  options: { includeExamples?: boolean } = {},
): Promise<WorkspaceSetupResult> {
  const normalizedLocale = normalizeWorkspaceLocale(locale);
  const profileFolder = await app.vault.adapter.stat('.lifeos');
  if (profileFolder && profileFolder.type !== 'folder')
    throw new Error('A file already exists where .lifeos is required.');
  const profileEntry = await app.vault.adapter.exists(WORKSPACE_PROFILE_PATH);
  const existingProfile = await readWorkspaceProfile(app);
  if (profileEntry && !existingProfile) {
    throw new Error(`The LifeOS workspace profile is invalid: ${WORKSPACE_PROFILE_PATH}`);
  }
  if (existingProfile && (existingProfile.template !== mode || existingProfile.locale !== normalizedLocale)) {
    throw new Error('This workspace already uses a different LifeOS template or language.');
  }

  const startPath = getStartHerePlan(settings, mode, normalizedLocale).path;
  const examplePlan = getExamplePlan(mode, normalizedLocale);
  const result: WorkspaceSetupResult = {
    created: [],
    skipped: [],
    startPath,
    examplePaths: options.includeExamples === false ? [] : [examplePlan.path],
  };
  const plans = getBasicTemplatePlans(settings, mode, normalizedLocale, {
    includeGuide: true,
    includeExample: options.includeExamples !== false,
  });

  for (const plan of plans) {
    const normalizedPath = normalizePath(plan.path);
    const target = app.vault.getAbstractFileByPath(normalizedPath);
    if (target instanceof TFolder)
      throw new Error(`A folder already exists where a file is required: ${normalizedPath}`);

    const segments = normalizedPath.split('/').slice(0, -1);
    let currentPath = '';
    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const parent = app.vault.getAbstractFileByPath(currentPath);
      if (parent instanceof TFile) throw new Error(`A file already exists where a folder is required: ${currentPath}`);
    }
  }

  for (const plan of plans) {
    const normalizedPath = normalizePath(plan.path);
    const parentPath = normalizedPath.split('/').slice(0, -1).join('/');
    await ensureFolder(app, parentPath, result);

    const existing = app.vault.getAbstractFileByPath(normalizedPath);
    if (existing instanceof TFile) {
      result.skipped.push(normalizedPath);
      continue;
    }
    if (existing) throw new Error(`A folder already exists where a template is required: ${normalizedPath}`);

    await app.vault.create(normalizedPath, plan.content);
    result.created.push(normalizedPath);
  }

  if (!existingProfile) {
    if (!profileFolder) {
      await app.vault.adapter.mkdir('.lifeos');
      result.created.push('.lifeos');
    }
    const profile: WorkspaceProfile = {
      schemaVersion: 1,
      template: mode,
      locale: normalizedLocale,
      initializedAt: new Date().toISOString(),
    };
    await app.vault.adapter.write(WORKSPACE_PROFILE_PATH, `${JSON.stringify(profile, null, 2)}\n`);
    result.created.push(WORKSPACE_PROFILE_PATH);
  }

  return result;
}

export function initializeWorkspace(
  ...args: Parameters<typeof initializeWorkspaceUnlocked>
): Promise<WorkspaceSetupResult> {
  return withVaultLock(args[0].vault, () => initializeWorkspaceUnlocked(...args));
}

export async function readWorkspaceProfile(app: App): Promise<WorkspaceProfile | null> {
  if (!(await app.vault.adapter.exists(WORKSPACE_PROFILE_PATH))) return null;
  try {
    const parsed = JSON.parse(await app.vault.adapter.read(WORKSPACE_PROFILE_PATH)) as Partial<WorkspaceProfile>;
    if (
      parsed.schemaVersion === 1 &&
      (parsed.template === 'periodic' || parsed.template === 'para' || parsed.template === 'theme') &&
      typeof parsed.locale === 'string' &&
      Object.prototype.hasOwnProperty.call(WORKSPACE_LANGUAGES, parsed.locale)
    ) {
      return parsed as WorkspaceProfile;
    }
  } catch {
    return null;
  }
  return null;
}

export async function removeUntouchedExamples(
  app: App,
  mode: WorkspaceMode,
  locale?: string,
): Promise<{ removed: string[]; preserved: string[] }> {
  const plan = getExamplePlan(mode, locale);
  const file = app.vault.getAbstractFileByPath(plan.path);
  if (!(file instanceof TFile)) return { removed: [], preserved: [] };

  if ((await app.vault.read(file)) !== plan.content) {
    return { removed: [], preserved: [plan.path] };
  }

  await app.fileManager.trashFile(file);
  const folderPath = plan.path.split('/').slice(0, -1).join('/');
  const folder = app.vault.getAbstractFileByPath(folderPath);
  if (folder instanceof TFolder && folder.children.length === 0) await app.fileManager.trashFile(folder);
  return { removed: [plan.path], preserved: [] };
}

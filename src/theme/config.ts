import type { PluginSettings, IndexType } from '../type';
import type { ThemeKind } from '../capture/theme-model';

export const normalizeThemePath = (path: string) => path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
export function themeIndexStyle(settings: PluginSettings): IndexType {
  return settings.usePARANotes
    ? settings.usePARAAdvanced
      ? settings.paraIndexFilename
      : 'readme'
    : settings.useThemeAdvanced
      ? settings.themeIndexFilename
      : 'readme';
}
export function isThemeIndex(filename: string, folder: string, style: IndexType): boolean {
  return style === 'folderName' ? filename === `${folder}.md` : /^(?:.*\.)?README\.md$/i.test(filename);
}
export function themeRoots(settings: PluginSettings): { kind: ThemeKind; root: string }[] {
  const roots: [ThemeKind, string][] = settings.usePARANotes
    ? [
        ['project', settings.projectsPath],
        ['area', settings.areasPath],
        ['resource', settings.resourcesPath],
        ['archive', settings.archivesPath],
      ]
    : [['theme', settings.themesPath]];
  return roots.filter(([, root]) => Boolean(root)).map(([kind, root]) => ({ kind, root: normalizeThemePath(root) }));
}
export function themeTemplatePaths(settings: PluginSettings): string[] {
  return [
    ...themeRoots(settings).map(({ root }) => `${root}/Template.md`),
    settings.themesTemplateFilePath,
    settings.projectsTemplateFilePath,
    settings.areasTemplateFilePath,
    settings.resourcesTemplateFilePath,
    settings.archivesTemplateFilePath,
    settings.periodicNotesTemplateFilePathDaily,
    settings.periodicNotesTemplateFilePathWeekly,
    settings.periodicNotesTemplateFilePathMonthly,
    settings.periodicNotesTemplateFilePathQuarterly,
    settings.periodicNotesTemplateFilePathYearly,
  ]
    .filter(Boolean)
    .map(normalizeThemePath);
}
/** Preserve legacy users who disabled PARA; enabling themes is an explicit choice. */
export function migrateThemeSettings(saved: Partial<PluginSettings> | null | undefined): Partial<PluginSettings> {
  return saved && saved.useThemeNotes === undefined ? { useThemeNotes: saved.usePARANotes !== false } : {};
}

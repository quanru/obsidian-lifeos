export const FULL_DAILY_REG = /\d{4}\/Daily\/\d{2}\/\d{4}-\d{2}-\d{2}\.md$/;
export const FULL_WEEKLY_REG = /\d{4}\/Weekly\/\d{4}-W(\d{1,2})\.md$/;
export const FULL_MONTHLY_REG = /\d{4}\/Monthly\/\d{4}-\d{1,2}\.md$/;
export const FULL_QUARTERLY_REG = /\d{4}\/Quarterly\/\d{4}-Q\d{1,2}\.md$/;
export const FULL_YEARLY_REG = /\d{4}\/\d{4}\.md$/;

/**
 * Join path segments into a normalized, vault-relative path.
 *
 * `Vault.getAbstractFileByPath()` does NOT normalize the path it receives,
 * while `Vault.create()` does. Building a path with a template literal such as
 * `` `${settings.periodicNotesPath}/${year}/...` `` therefore yields a double
 * slash whenever `periodicNotesPath` is `/` (vault root) or has a trailing
 * slash — e.g. `//2026/Daily/10/2026-10-01.md`. The lookup then silently
 * misses the existing file, so `createFile()` falls through to
 * `Vault.create()` and throws `Error: File already exists.`
 */
export function joinVaultPath(...segments: Array<string | undefined | null>): string {
  return segments
    .map((segment) => String(segment ?? '').replace(/^\/+|\/+$/g, ''))
    .filter((segment) => segment.length > 0)
    .join('/');
}

/**
 * Normalize `settings.periodicNotesPath` for prefix checks and regex building.
 * `Foo/` normalizes to `Foo`; `/` (vault root) normalizes to `''`.
 */
export function normalizePeriodicNotesPath(periodicNotesPath: string | undefined | null): string {
  return String(periodicNotesPath ?? '').replace(/^\/+|\/+$/g, '');
}

/**
 * Whether `path` lives inside the configured periodic-notes folder.
 * A `periodicNotesPath` of `/` means "vault root" and matches every path.
 */
export function isInPeriodicNotesFolder(
  path: string | undefined,
  settings: { periodicNotesPath?: string } | undefined,
): boolean {
  if (!path || !settings?.periodicNotesPath) {
    return false;
  }

  const base = normalizePeriodicNotesPath(settings.periodicNotesPath);

  if (!base) {
    return true;
  }

  return path === base || !!path?.startsWith(`${base}/`);
}

/** Escape a literal string so it can be embedded in a `RegExp`. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isInPeriodicNote(path: string | undefined, settings: { periodicNotesPath?: string }): boolean {
  if (!path || !settings.periodicNotesPath) return false;
  const base = normalizePeriodicNotesPath(settings.periodicNotesPath);
  const prefix = base ? `${escapeRegExp(base)}/` : '';
  return [FULL_YEARLY_REG, FULL_QUARTERLY_REG, FULL_MONTHLY_REG, FULL_WEEKLY_REG, FULL_DAILY_REG].some((pattern) =>
    new RegExp(`^${prefix}${pattern.source}`).test(path),
  );
}

/** The same complete path is used for creation and calendar existence checks. */
export function buildPeriodicFilePath(
  base: string,
  year: string,
  periodType: string,
  title: string,
  month?: string,
): string {
  if (periodType === 'Yearly') return joinVaultPath(base, year, `${title}.md`);
  return joinVaultPath(base, year, periodType, periodType === 'Daily' ? month : '', `${title}.md`);
}

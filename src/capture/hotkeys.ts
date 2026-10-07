import type { App } from 'obsidian';

// Obsidian does not expose settings navigation in its public App type.
// Keep this optional integration in one place; commands remain assignable manually.
export function openCaptureHotkeys(app: App, command: string): boolean {
  const setting = (
    app as App & {
      setting?: { open: () => void; openTabById: (id: string) => { setQuery?: (query: string) => void } | undefined };
    }
  ).setting;
  if (!setting?.open || !setting.openTabById) return false;
  try {
    setting.open();
    setting.openTabById('hotkeys')?.setQuery?.(`LifeOS: ${command}`);
    return true;
  } catch {
    return false;
  }
}

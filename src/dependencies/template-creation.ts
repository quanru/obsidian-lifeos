import type { App } from 'obsidian';
import { TFile } from 'obsidian';

type TemplaterIntegration = {
  templater?: {
    create_new_note_from_template?: (
      template: TFile,
      folder: string,
      filename: string,
      openNew: boolean,
    ) => Promise<TFile | undefined>;
  };
};

/** Await Templater's creation transaction, including its pending-file guard. */
export async function createFromTemplate(app: App, template: TFile, content: string, filePath: string) {
  const plugins = (
    app as App & {
      plugins?: { enabledPlugins: Set<string>; plugins: Record<string, TemplaterIntegration> };
    }
  ).plugins;
  const templater = plugins?.enabledPlugins?.has('templater-obsidian')
    ? plugins.plugins['templater-obsidian']?.templater
    : undefined;
  if (/<%[\s\S]*?%>/.test(content) && templater?.create_new_note_from_template) {
    const slash = filePath.lastIndexOf('/');
    const folder = slash < 0 ? '/' : filePath.slice(0, slash);
    const filename = filePath.slice(slash + 1).replace(/\.md$/, '');
    const created = await templater.create_new_note_from_template(template, folder, filename, false);
    if (!(created instanceof TFile)) throw new Error(`Templater could not create note: ${filePath}`);
    return created;
  }
  return app.vault.create(filePath, content);
}

import { type App, TFolder, normalizePath } from 'obsidian';

/** Older Obsidian versions lack the public attachment-path API. Use a dedicated vault folder. */
export async function captureAttachmentPath(
  app: App,
  name: string,
  sourcePath: string,
): Promise<string> {
  if (typeof app.fileManager.getAvailablePathForAttachment === 'function') {
    return app.fileManager.getAvailablePathForAttachment(name, sourcePath);
  }
  const folder = 'LifeOS Attachments';
  if (!app.vault.getAbstractFileByPath(folder)) {
    try {
      await app.vault.createFolder(folder);
    } catch (error) {
      if (!(app.vault.getAbstractFileByPath(folder) instanceof TFolder))
        throw error;
    }
  }
  if (!(app.vault.getAbstractFileByPath(folder) instanceof TFolder))
    throw new Error('The attachment folder is unavailable.');
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const suffix = dot > 0 ? name.slice(dot) : '';
  let path = normalizePath(`${folder}/${name}`);
  for (let index = 1; app.vault.getAbstractFileByPath(path); index++)
    path = normalizePath(`${folder}/${stem}-${index}${suffix}`);
  return path;
}

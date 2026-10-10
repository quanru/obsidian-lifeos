import { MarkdownRenderer, type App, type MarkdownPostProcessorContext } from 'obsidian';
import type { PluginSettings } from '../type';
import { renderTaskQuery } from '../component/TaskQuery';
import { themeIndexNotes, themeSnapshot } from './catalog';
import { themeTags } from '../capture/theme-model';
import { themeSettingsMessages } from './messages';
export class Theme {
  constructor(
    private app: App,
    private settings: PluginSettings,
    private locale: string,
  ) {}
  snapshot = (dir = this.settings.themesPath) => themeSnapshot(this.app, this.settings, dir);
  listByFolder = (_source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => this.render(el, ctx, false);
  listByTag = (_source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => this.render(el, ctx, true);
  private render(el: HTMLElement, ctx: MarkdownPostProcessorContext, byTag: boolean) {
    return renderTaskQuery(
      this.app,
      el,
      ctx,
      async (container, component) => {
        const m = themeSettingsMessages(this.locale);
        const file = this.app.vault.getFileByPath(ctx.sourcePath);
        const tags = byTag && file ? themeTags(this.app.metadataCache.getFileCache(file)?.frontmatter?.tags) : [];
        const notes =
          byTag && !tags.length
            ? []
            : themeIndexNotes(this.app, this.settings).filter(
                (note) =>
                  note.path !== ctx.sourcePath &&
                  (!byTag ||
                    note.tags.some((tag) => tags.some((value) => tag === value || tag.startsWith(`${value}/`)))),
              );
        const list = container.createDiv('lifeos-theme-list');
        const update = async (value: string) => {
          list.empty();
          const matches = notes.filter((note) =>
            `${note.name} ${note.tags.join(' ')}`.toLocaleLowerCase().includes(value.toLocaleLowerCase()),
          );
          if (!matches.length) {
            list.createEl('p', { text: m.empty });
            return;
          }
          await MarkdownRenderer.render(
            this.app,
            matches.map((note, index) => `${index + 1}. [[${note.path}|${note.name}]]`).join('\n'),
            list,
            ctx.sourcePath,
            component,
          );
        };
        if (this.settings.useThemeSearch) {
          const input = container.createEl('input', {
            type: 'search',
            attr: { placeholder: m.search, 'aria-label': m.search },
          });
          container.insertBefore(input, list);
          input.oninput = () => void update(input.value);
        }
        await update('');
      },
      this.locale,
    );
  }
}

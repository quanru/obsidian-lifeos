import { type App, type MarkdownPostProcessorContext, MarkdownRenderer } from 'obsidian';
import { Date as PeriodicDate } from '../periodic/Date';
import type { File } from '../periodic/File';
import type { PluginSettings } from '../type';
import { renderTaskQuery } from '../component/TaskQuery';
import { themeSettingsMessages } from '../theme/messages';

export class Item {
  date: PeriodicDate;
  constructor(
    public dir: string,
    public app: App,
    public settings: PluginSettings,
    public file: File,
    public locale: string,
  ) {
    this.date = new PeriodicDate(app, settings, file, locale);
  }
  snapshot(dir = this.dir) {
    return this.file.list(dir);
  }
  listByFolder = (_source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => this.render(el, ctx, false);
  listByTag = (_source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => this.render(el, ctx, true);
  private render(el: HTMLElement, ctx: MarkdownPostProcessorContext, byTag: boolean) {
    return renderTaskQuery(
      this.app,
      el,
      ctx,
      async (container, component) => {
        const m = themeSettingsMessages(this.locale);
        const tags = byTag ? this.file.tags(ctx.sourcePath) : [];
        const rows = (byTag && !tags.length ? '' : this.file.list(this.dir, { tags })).split('\n').filter(Boolean);
        const search = this.settings.useThemeSearch
          ? container.createEl('input', { type: 'search', attr: { placeholder: m.search, 'aria-label': m.search } })
          : undefined;
        const list = container.createDiv('lifeos-theme-list');
        const update = async () => {
          list.empty();
          const filtered = rows.filter((row) =>
            row.toLocaleLowerCase().includes(search?.value.toLocaleLowerCase() || ''),
          );
          await MarkdownRenderer.render(this.app, filtered.join('\n') || m.empty, list, ctx.sourcePath, component);
        };
        if (search) search.oninput = () => void update();
        await update();
      },
      this.locale,
    );
  }
}

import { type App, Modal, Notice } from 'obsidian';
import { dependencyMessages } from '../dependencies/messages';
import { entryMessages } from '../onboarding/entry-messages';
import type { PluginSettings } from '../type';
import { captureThemes } from './theme-catalog';
import { type ThemeMessages, themeMessages } from './theme-messages';
import { type CaptureTheme, applyThemeSelection, matchedThemes } from './theme-model';

export class ThemePicker extends Modal {
  private m: ThemeMessages;
  private opened = false;
  private themes: CaptureTheme[] = [];
  private original: string[] = [];
  private selected = new Set<string>();
  private text = '';
  constructor(
    app: App,
    private readonly settings: PluginSettings,
    private readonly locale: string,
    private readonly read: () => string,
    private readonly apply: (text: string) => Promise<boolean>,
    private readonly openTheme: (path: string) => Promise<void>,
    private readonly defaultSelection?: {
      read: () => string[];
      apply: (paths: string[]) => Promise<boolean>;
      title?: string;
    },
  ) {
    super(app);
    this.m = themeMessages(locale);
  }
  async onOpen(): Promise<void> {
    this.opened = true;
    this.modalEl.addClass('lifeos-theme-picker');
    this.modalEl.dir = this.locale.startsWith('ar') ? 'rtl' : 'ltr';
    this.setTitle(this.defaultSelection?.title ?? this.m.title);
    this.text = this.read();
    await this.load();
  }
  private async load(): Promise<void> {
    this.contentEl.empty();
    this.contentEl.createEl('p', { text: this.m.loading, attr: { role: 'status' } });
    try {
      this.themes = await captureThemes(this.app, this.settings);
      if (!this.opened) return;
      this.original = this.defaultSelection
        ? [...this.defaultSelection.read()]
        : matchedThemes(this.text, this.themes).map((theme) => theme.path);
      this.selected = new Set(this.original);
      this.render();
    } catch {
      if (!this.opened) return;
      this.contentEl.empty();
      this.contentEl.createEl('p', { text: this.m.loadFailed, attr: { role: 'status' } });
      const retry = this.contentEl.createEl('button', { text: dependencyMessages(this.locale).retry });
      retry.onclick = () => void this.load();
    }
  }
  private render(): void {
    this.contentEl.empty();
    const search = this.contentEl.createEl('input', {
      type: 'search',
      attr: { 'aria-label': this.m.search, placeholder: this.m.search },
    });
    const frequencies = new Map<string, number>();
    this.themes.forEach((theme) => theme.tags.forEach((tag) => frequencies.set(tag, (frequencies.get(tag) ?? 0) + 1)));
    if ([...frequencies.values()].some((count) => count > 1))
      this.contentEl.createEl('p', {
        text: this.m.shared,
        cls: 'lifeos-theme-shared',
        attr: { role: 'status' },
      });
    const list = this.contentEl.createDiv('lifeos-theme-options');
    const render = () => {
      list.empty();
      const query = search.value.trim().toLocaleLowerCase();
      const checks = new Map<string, HTMLInputElement>();
      const visible = this.themes.filter((theme) =>
        `${theme.name} ${theme.tags.join(' ')} ${this.m[theme.kind]}`.toLocaleLowerCase().includes(query),
      );
      for (const theme of visible) {
        const row = list.createDiv('lifeos-theme-row');
        const label = row.createEl('label');
        const check = label.createEl('input', { type: 'checkbox' });
        check.checked = this.selected.has(theme.path);
        checks.set(theme.path, check);
        check.onchange = () => {
          if (check.checked) this.selected.add(theme.path);
          else this.selected.delete(theme.path);
          if (!this.defaultSelection) {
            const effective = applyThemeSelection(this.text, this.themes, this.original, [...this.selected]);
            this.selected = new Set(matchedThemes(effective, this.themes).map((item) => item.path));
          }
          // Update shared-tag matches without replacing the focused checkbox.
          checks.forEach((input, path) => {
            input.checked = this.selected.has(path);
          });
        };
        const info = label.createSpan();
        info.createEl('strong', {
          text: `${this.m[theme.kind]} · ${theme.name}`,
        });
        info.createEl('small', {
          text: theme.tags.map((tag) => `#${tag}`).join(' '),
        });
        const open = row.createEl('button', {
          text: '↗',
          attr: {
            'aria-label': `${this.m.open}: ${theme.name}`,
            title: `${this.m.open}: ${theme.name}`,
          },
        });
        open.onclick = () => {
          void this.openTheme(theme.path)
            .then(() => this.close())
            .catch(() => new Notice(this.m.changed));
        };
      }
      if (!visible.length) {
        list.createEl('p', {
          text: this.themes.length ? this.m.noResults : this.m.empty,
          attr: { role: 'status' },
        });
        if (!this.themes.length) {
          const help = entryMessages(this.locale);
          list.createEl('p', { text: help.emptyThemeHelp, cls: 'lifeos-theme-help' });
          const links = list.createDiv('lifeos-theme-help-links');
          links.createEl('a', {
            text: help.themeGuide,
            href: `https://github.com/quanru/obsidian-lifeos/blob/main/docs/theme-notes${this.locale.startsWith('zh') ? '.md' : '.en.md'}`,
            attr: { target: '_blank', rel: 'noopener noreferrer' },
          });
          links.createEl('a', {
            text: help.examples,
            href: 'https://github.com/quanru/obsidian-example-lifeos/releases/latest',
            attr: { target: '_blank', rel: 'noopener noreferrer' },
          });
        }
        if (query && this.themes.length) {
          const clear = list.createEl('button', { text: this.m.clearSearch });
          clear.onclick = () => {
            search.value = '';
            render();
            search.focus();
          };
        }
      }
    };
    search.oninput = render;
    render();
    const footer = this.contentEl.createDiv('lifeos-theme-footer');
    const cancel = footer.createEl('button', { text: this.m.cancel });
    cancel.onclick = () => this.close();
    const save = footer.createEl('button', {
      text: this.m.save,
      cls: 'mod-cta',
    });
    save.onclick = async () => {
      save.disabled = true;
      try {
        if (this.defaultSelection && JSON.stringify(this.defaultSelection.read()) !== JSON.stringify(this.original))
          throw new Error('defaults changed');
        if (this.read() !== this.text) throw new Error('draft changed');
        const current = await captureThemes(this.app, this.settings);
        if (!this.opened) return;
        // Detect changed catalog membership or tags before applying the dialog's selection.
        if (JSON.stringify(current) !== JSON.stringify(this.themes)) throw new Error('catalog changed');
        if (this.read() !== this.text) throw new Error('draft changed');
        if (this.defaultSelection) {
          if (JSON.stringify(this.defaultSelection.read()) !== JSON.stringify(this.original))
            throw new Error('defaults changed');
          if (await this.defaultSelection.apply([...this.selected])) this.close();
          return;
        }
        const next = applyThemeSelection(this.text, this.themes, this.original, [...this.selected]);
        if (await this.apply(next)) this.close();
      } catch {
        new Notice(this.m.changed);
      } finally {
        if (this.opened) save.disabled = false;
      }
    };
    search.focus();
  }
  onClose(): void {
    this.opened = false;
    this.contentEl.empty();
  }
}

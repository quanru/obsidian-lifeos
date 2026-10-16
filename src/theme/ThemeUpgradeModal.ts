import { Modal, Notice, TFile } from 'obsidian';
import type LifeOS from '../main';
import { identifyTheme } from '../capture/theme-model';
import { themeTemplatePaths } from './config';
import { applyThemeUpgrade, planThemeUpgrade, type ThemeQueryChange } from './upgrade-plan';
import { themeUpgradeMessages } from './upgrade-messages';
import './upgrade.less';

export class ThemeUpgradeModal extends Modal {
  private snapshot = '';
  private originalPath: string;
  private closed = false;
  private busy = false;
  private changes: ThemeQueryChange[] = [];
  private selected = new Set<number>();
  private messages: ReturnType<typeof themeUpgradeMessages>;
  constructor(
    private plugin: LifeOS,
    private file: TFile,
  ) {
    super(plugin.app);
    this.originalPath = file.path;
    this.messages = themeUpgradeMessages(plugin.getCurrentLocaleKey());
  }
  onOpen() {
    this.modalEl.addClass('lifeos-theme-upgrade');
    this.setTitle(this.messages.title);
    void this.preview();
  }
  onClose() {
    this.closed = true;
    this.contentEl.empty();
  }
  private async preview(message?: string) {
    this.changes = [];
    this.selected.clear();
    this.contentEl.empty();
    this.contentEl.createEl('p', { text: this.messages.loading });
    try {
      const content = await this.app.vault.read(this.file);
      if (this.closed) return;
      this.snapshot = content;
      this.originalPath = this.file.path;
      this.changes = planThemeUpgrade(content);
      this.selected = new Set(this.changes.map((_, index) => index));
      this.render(message);
    } catch {
      if (!this.closed) this.render(this.messages.failed);
    }
  }
  private render(message?: string) {
    const el = this.contentEl;
    el.empty();
    el.createEl('p', { text: this.originalPath, cls: 'lifeos-theme-upgrade-path' });
    el.createEl('p', { text: this.messages.help });
    if (message) el.createEl('p', { text: message, attr: { role: 'status' } });
    if (!this.changes.length) el.createEl('p', { text: this.messages.empty });
    const list = el.createDiv('lifeos-theme-upgrade-list');
    const apply = el.createEl('button', { text: this.messages.apply });
    apply.disabled = !this.selected.size;
    this.changes.forEach((change, index) => {
      const item = list.createDiv('lifeos-theme-upgrade-item');
      const label = item.createEl('label');
      const input = label.createEl('input', { type: 'checkbox' });
      input.checked = this.selected.has(index);
      label.createSpan({ text: `${this.messages.line} ${change.line}` });
      input.onchange = () => {
        input.checked ? this.selected.add(index) : this.selected.delete(index);
        apply.disabled = !this.selected.size;
      };
      for (const [title, value] of [
        [this.messages.before, change.before],
        [this.messages.after, change.after],
      ]) {
        item.createEl('div', { text: title, cls: 'lifeos-theme-upgrade-label' });
        item.createEl('pre').createEl('code', { text: value.trimEnd() });
      }
    });
    apply.onclick = async () => {
      if (this.busy || !this.selected.size) return;
      this.busy = true;
      apply.disabled = true;
      const selected = this.changes.filter((_, index) => this.selected.has(index));
      try {
        await this.app.vault.process(this.file, (current) => {
          if (this.file.path !== this.originalPath || current !== this.snapshot) throw new Error('stale-theme-upgrade');
          return applyThemeUpgrade(current, selected);
        });
        new Notice(this.messages.done);
        this.close();
      } catch (error) {
        await this.preview(
          error instanceof Error && error.message === 'stale-theme-upgrade'
            ? this.messages.stale
            : this.messages.failed,
        );
      } finally {
        this.busy = false;
      }
    };
    const refresh = el.createEl('button', { text: this.messages.refresh });
    refresh.onclick = () => {
      if (!this.busy) void this.preview();
    };
    const cancel = el.createEl('button', { text: this.messages.cancel });
    cancel.onclick = () => this.close();
  }
}

export function registerThemeUpgrade(plugin: LifeOS) {
  const eligible = (file: TFile | null) =>
    file && (identifyTheme(file.path, plugin.settings) || themeTemplatePaths(plugin.settings).includes(file.path));
  plugin.addCommand({
    id: 'upgrade-theme-queries',
    name: themeUpgradeMessages(plugin.getCurrentLocaleKey()).title,
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!eligible(file)) return false;
      if (!checking) new ThemeUpgradeModal(plugin, file!).open();
      return true;
    },
  });
  plugin.registerEvent(
    plugin.app.workspace.on('file-menu', (menu, file) => {
      if (!(file instanceof TFile) || !eligible(file)) return;
      menu.addItem((item) =>
        item
          .setTitle(themeUpgradeMessages(plugin.getCurrentLocaleKey()).title)
          .setIcon('list-checks')
          .onClick(() => new ThemeUpgradeModal(plugin, file).open()),
      );
    }),
  );
}

import { type App, Component, MarkdownRenderer, Modal, Notice, setIcon } from 'obsidian';
import { type CaptureRecord, toggleRecordTask } from './history';
import { interactionMessages } from './interaction-messages';
import type { CaptureMessages } from './messages';
import { themeMessages } from './theme-messages';
import type { CaptureTheme } from './theme-model';
import { matchedThemes } from './theme-model';

export class DeleteCaptureModal extends Modal {
  constructor(
    app: App,
    private readonly m: CaptureMessages,
    private readonly remove: () => Promise<void>,
  ) {
    super(app);
  }
  onOpen(): void {
    this.setTitle(this.m.deleteTitle);
    this.contentEl.createEl('p', { text: this.m.deleteHint });
    const actions = this.contentEl.createDiv('lifeos-capture-actions');
    const cancel = actions.createEl('button', { text: this.m.cancel });
    cancel.onclick = () => this.close();
    const remove = actions.createEl('button', {
      text: this.m.remove,
      cls: 'mod-warning',
    });
    remove.onclick = async () => {
      remove.disabled = true;
      cancel.disabled = true;
      await this.remove();
      this.close();
    };
  }
  onClose(): void {
    this.contentEl.empty();
  }
}

export async function renderRecord(
  app: App,
  host: HTMLElement,
  record: CaptureRecord,
  m: CaptureMessages,
  scope: Component,
  themes: CaptureTheme[],
  locale: string,
  callbacks: {
    edit(card: HTMLElement): void;
    remove(): void;
    open(): void;
    toggle(text: string): Promise<void>;
    associate(): void;
    openTheme(path: string): void;
  },
): Promise<void> {
  const card = host.createDiv('lifeos-capture-card');
  const header = card.createDiv('lifeos-capture-card-header');
  header.createEl('time', {
    text: record.time || '—',
    cls: 'lifeos-capture-stamp',
  });
  const t = interactionMessages(locale);
  const tm = themeMessages(locale);
  const matches = matchedThemes(record.text, themes);
  if (matches.length) {
    const links = card.createDiv('lifeos-capture-themes');
    for (const theme of matches) {
      const button = links.createEl('button', {
        text: `${tm[theme.kind]} · ${theme.name}`,
        attr: { 'aria-label': `${tm.open}: ${theme.name}` },
      });
      button.onclick = () => callbacks.openTheme(theme.path);
    }
  }
  const body = card.createDiv('lifeos-capture-body markdown-rendered');
  const text =
    record.kind === 'task' ? `- [${record.checked ? 'x' : ' '}] ${record.text.replace(/\n/g, '\n  ')}` : record.text;
  await MarkdownRenderer.render(app, text, body, record.path, scope);
  card.createEl('small', { text: t.source, cls: 'lifeos-capture-source' });
  const actions = card.createDiv('lifeos-capture-actions');
  const action = (label: string, icon: string, run: () => void) => {
    const button = actions.createEl('button', { attr: { 'aria-label': label, title: label } });
    setIcon(button, icon);
    button.onclick = run;
  };
  action(tm.associate, 'tags', callbacks.associate);
  action(t.copy, 'copy', () => {
    void card.ownerDocument
      .defaultView!.navigator.clipboard.writeText(text)
      .then(() => new Notice(t.copied))
      .catch(() => new Notice(m.failed));
  });
  action(m.edit, 'pencil', () => callbacks.edit(card));
  action(m.remove, 'trash-2', callbacks.remove);
  action(m.open, 'external-link', callbacks.open);
  card.ondblclick = (event) => {
    if ((event.target as Element).closest('button,a,input,textarea,summary,[contenteditable="true"]')) return;
    callbacks.open();
  };
  body.querySelectorAll<HTMLInputElement>('input.task-list-item-checkbox').forEach((checkbox, index) => {
    const previous = checkbox.checked;
    checkbox.disabled = false;
    // Handle before Obsidian's renderer listeners; writes must go through conflict checking.
    checkbox.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        checkbox.disabled = true;
        void callbacks.toggle(toggleRecordTask(record, index, !previous)).finally(() => {
          checkbox.disabled = false;
        });
      },
      { capture: true },
    );
  });
}

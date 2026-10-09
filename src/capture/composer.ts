import dayjs from 'dayjs';
import { type App, Notice, TFile, setIcon } from 'obsidian';
import { DAILY } from '../constant';
import { periodicLocation } from '../periodic/calendar';
import type { PluginSettings } from '../type';
import { createPeriodicFile } from '../util';
import { withVaultLock } from '../vault-lock';
import { DraftEditor } from './DraftEditor';
import { ThemePicker } from './ThemePicker';
import { captureAttachmentPath } from './attachments';
import type { QuickCaptureKind } from './content';
import type { CaptureMessages } from './messages';
import { themeMessages } from './theme-messages';

export class CaptureComposer {
  readonly input: HTMLTextAreaElement;
  private native?: DraftEditor;
  private nativeHost: HTMLElement;
  private nativeReady = false;
  private sourceMode = false;
  private ready = false;
  private closed = false;
  private initializationError?: string;
  private picker?: ThemePicker;
  kind: QuickCaptureKind;
  private footer: HTMLDivElement;
  private saveButton: HTMLButtonElement;
  private cancelButton: HTMLButtonElement;
  private busy = false;
  private sourcePath?: string;
  private controls: HTMLButtonElement[] = [];
  private kindButtons = new Map<QuickCaptureKind, HTMLButtonElement>();

  constructor(
    private readonly app: App,
    private readonly settings: PluginSettings,
    private readonly locale: string,
    host: HTMLElement,
    private readonly m: CaptureMessages,
    kind: QuickCaptureKind,
    save: () => Promise<void>,
    cancel: () => void,
    private readonly kindChanged: (kind: QuickCaptureKind) => void = () => {},
  ) {
    this.kind = kind;
    const area = host.createDiv('lifeos-capture-composer');
    this.input = area.createEl('textarea', {
      attr: {
        'aria-label': m.placeholder,
        placeholder: m.placeholder,
        rows: '5',
      },
    });
    this.nativeHost = area.createDiv('lifeos-capture-native');
    this.nativeHost.textContent = themeMessages(locale).loading;
    this.nativeHost.style.setProperty('--lifeos-capture-placeholder', JSON.stringify(m.placeholder));
    this.input.hidden = true;
    this.footer = area.createDiv('lifeos-capture-toolbar');
    const types = this.footer.createDiv('lifeos-capture-kind');
    types.setAttribute('role', 'group');
    for (const [value, label, icon] of [
      ['record', m.record, 'list'],
      ['task', m.task, 'square-check'],
    ] as const) {
      const button = types.createEl('button', {
        cls: 'lifeos-capture-tool',
        attr: { 'aria-label': label, title: label, 'aria-pressed': String(kind === value) },
      });
      setIcon(button, icon);
      button.createSpan({ text: label });
      button.onclick = () => {
        if (this.busy || !this.ready) return;
        this.setKind(value);
        this.focus();
      };
      this.kindButtons.set(value, button);
      this.controls.push(button);
    }
    const tm = themeMessages(locale);
    this.button(tm.associate, 'tags', () => {
      this.picker = new ThemePicker(
        app,
        settings,
        locale,
        () => this.getText(),
        async (text) => {
          this.setText(text);
          return true;
        },
        async (path) => {
          const file = app.vault.getAbstractFileByPath(path);
          if (file instanceof TFile) await app.workspace.getLeaf('tab').openFile(file);
        },
      );
      this.picker.open();
    });
    this.footer.createSpan('lifeos-capture-spacer');
    this.cancelButton = this.footer.createEl('button', { text: m.cancel });
    this.cancelButton.hidden = true;
    this.cancelButton.onclick = cancel;
    this.saveButton = this.footer.createEl('button', {
      text: m.save,
      cls: 'mod-cta lifeos-capture-save',
    });
    this.saveButton.onclick = () => {
      if (!this.busy && this.ready) void save();
    };
    area.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.isComposing) {
          event.preventDefault();
          if (!this.busy && this.ready) void save();
        }
      },
      { capture: true },
    );
    area.addEventListener(
      'paste',
      (event) => {
        const image = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
        if (image && !this.busy) {
          event.preventDefault();
          event.stopImmediatePropagation();
          void this.addImage(image);
        }
      },
      { capture: true },
    );
    this.native = new DraftEditor(
      app,
      this.nativeHost,
      () => this.path(),
      m.placeholder,
      () => {
        this.input.value = this.native?.getText() ?? this.input.value;
      },
      (menu) => {
        menu.addSeparator();
        menu.addItem((item) =>
          item
            .setTitle(this.sourceMode ? tm.visual : tm.source)
            .setIcon(this.sourceMode ? 'eye' : 'code')
            .setDisabled(this.busy || !this.ready)
            .onClick(async () => {
              if (this.busy || this.closed || !this.nativeReady) return;
              const next = !this.sourceMode;
              try {
                await this.native?.setSource(next);
                this.sourceMode = next;
              } catch {
                new Notice(m.failed);
              }
            }),
        );
      },
    );
    this.setBusy(false);
    void this.native
      .mount()
      .then(() => {
        if (this.closed) return;
        this.nativeReady = true;
        this.ready = true;
        this.nativeHost.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) node.remove();
        });
        this.native?.setText(this.input.value, true);
        this.setBusy(this.busy);
      })
      .catch((error) => {
        this.initializationError = error instanceof Error ? error.message : String(error);
        if (this.closed) return;
        this.native?.destroy();
        this.native = undefined;
        this.nativeHost.hidden = true;
        this.input.hidden = false;
        this.ready = true;
        new Notice(tm.unavailable);
        this.setBusy(this.busy);
        this.focus();
      });
  }

  private path(): string {
    return this.sourcePath ?? periodicLocation(dayjs(), DAILY, this.settings).file;
  }
  private button(label: string, icon: string, action: () => void): HTMLButtonElement {
    const button = this.footer.createEl('button', {
      attr: { 'aria-label': label, title: label },
      cls: 'lifeos-capture-tool',
    });
    setIcon(button, icon);
    button.onclick = action;
    this.controls.push(button);
    return button;
  }
  getText(): string {
    return this.nativeReady ? this.native!.getText() : this.input.value;
  }
  private setText(text: string): void {
    this.input.value = text;
    this.native?.setText(text);
  }
  focus(): void {
    if (this.nativeReady) this.native?.focus();
    else this.input.focus();
  }
  private insert(text: string): void {
    if (this.nativeReady) this.native?.insert(text);
    else this.input.setRangeText(text, this.input.selectionStart, this.input.selectionEnd, 'end');
    this.focus();
  }
  private async addImage(image: File): Promise<void> {
    if (this.busy) return;
    if (!image.type.startsWith('image/') || image.size >= 20 * 1024 * 1024) {
      new Notice(this.m.imageLimit);
      return;
    }
    this.setBusy(true);
    try {
      const source = this.sourcePath
        ? this.app.vault.getAbstractFileByPath(this.sourcePath)
        : await createPeriodicFile(dayjs(), DAILY, this.settings, this.app, false, this.locale);
      if (!(source instanceof TFile)) throw new Error('The daily note is unavailable.');
      const name = image.name.replace(/[^\p{L}\p{N}._-]/gu, '-') || 'capture.png';
      const data = await image.arrayBuffer();
      const file = await withVaultLock(this.app.vault, async () => {
        const attachmentPath = await captureAttachmentPath(this.app, name, source.path);
        return this.app.vault.createBinary(attachmentPath, data);
      });
      this.insert(`\n!${this.app.fileManager.generateMarkdownLink(file, source.path)}\n`);
    } catch {
      new Notice(this.m.failed);
    } finally {
      this.setBusy(false);
    }
  }
  setBusy(busy: boolean): void {
    this.busy = busy;
    this.input.disabled = busy;
    this.native?.setBusy(busy);
    this.saveButton.disabled = busy || !this.ready;
    this.saveButton.textContent = busy ? this.m.saving : this.m.save;
    this.cancelButton.disabled = busy;
    this.controls.forEach((button) => {
      button.disabled = busy || !this.ready;
    });
  }

  setDraft(text: string, kind: QuickCaptureKind, editing = false, sourcePath?: string): void {
    this.sourcePath = sourcePath;
    this.input.value = text;
    this.native?.setText(text, true);
    this.setKind(kind);
    this.cancelButton.hidden = !editing;
    this.focus();
  }

  private setKind(kind: QuickCaptureKind): void {
    this.kind = kind;
    this.kindButtons.forEach((button, value) => button.setAttribute('aria-pressed', String(value === kind)));
    this.kindChanged(kind);
  }

  destroy(): void {
    this.closed = true;
    this.picker?.close();
    this.native?.destroy();
  }
}

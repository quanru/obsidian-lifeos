import dayjs from 'dayjs';
import { type App, Component, FuzzySuggestModal, MarkdownRenderer, Notice, TFile, setIcon } from 'obsidian';
import { DAILY } from '../constant';
import { periodicLocation } from '../periodic/calendar';
import type { PluginSettings } from '../type';
import { createPeriodicFile } from '../util';
import { withVaultLock } from '../vault-lock';
import { DraftEditor } from './DraftEditor';
import { ThemePicker } from './ThemePicker';
import { captureAttachmentPath } from './attachments';
import type { QuickCaptureKind } from './content';
import { interactionMessages } from './interaction-messages';
import type { CaptureMessages } from './messages';
import { themeMessages } from './theme-messages';

class NotePicker extends FuzzySuggestModal<TFile> {
  constructor(
    app: App,
    private readonly choose: (file: TFile) => void,
    label: string,
  ) {
    super(app);
    this.setPlaceholder(label);
  }
  getItems() {
    return this.app.vault.getMarkdownFiles();
  }
  getItemText(file: TFile) {
    return file.path;
  }
  onChooseItem(file: TFile) {
    this.choose(file);
  }
}

export class CaptureComposer {
  readonly input: HTMLTextAreaElement;
  private native?: DraftEditor;
  private nativeHost: HTMLElement;
  private nativeReady = false;
  private sourceButton?: HTMLButtonElement;
  private sourceMode = false;
  private ready = false;
  private closed = false;
  private initializationError?: string;
  private picker?: ThemePicker;
  kind: QuickCaptureKind;
  private preview: HTMLDivElement;
  private footer: HTMLDivElement;
  private toolHost?: HTMLElement;
  private moreTools!: HTMLDetailsElement;
  private saveButton: HTMLButtonElement;
  private cancelButton: HTMLButtonElement;
  private renderScope?: Component;
  private previewing = false;
  private busy = false;
  private sourcePath?: string;
  private editing = false;
  private modes: HTMLButtonElement[] = [];
  private controls: HTMLButtonElement[] = [];
  private imageInput: HTMLInputElement;
  private previewVersion = 0;

  constructor(
    private readonly app: App,
    private readonly settings: PluginSettings,
    private readonly locale: string,
    host: HTMLElement,
    private readonly m: CaptureMessages,
    kind: QuickCaptureKind,
    save: () => Promise<void>,
    cancel: () => void,
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
    this.preview = area.createDiv('lifeos-capture-preview');
    this.preview.hidden = true;
    this.footer = area.createDiv('lifeos-capture-toolbar');
    for (const mode of ['record', 'task'] as const) {
      const button = this.button(m[mode], mode === 'task' ? 'list-todo' : 'list', () => {
        this.kind = mode;
        this.updateModes();
      });
      button.createSpan({ text: m[mode] });
      this.modes.push(button);
    }
    this.updateModes();
    this.moreTools = this.footer.createEl('details', { cls: 'lifeos-capture-more-tools' });
    const moreLabel = interactionMessages(locale).moreTools;
    const summary = this.moreTools.createEl('summary', { attr: { 'aria-label': moreLabel, title: moreLabel } });
    setIcon(summary, 'ellipsis');
    this.toolHost = this.moreTools.createDiv('lifeos-capture-tools-menu');
    this.button(m.bold, 'bold', () => this.wrap('**', '**'));
    this.button(m.italic, 'italic', () => this.wrap('*', '*'));
    this.button(m.checkbox, 'list-checks', () => this.insert(`${this.getText().length ? '\n' : ''}- [ ] `));
    this.button(m.link, 'link', () =>
      new NotePicker(
        app,
        (file) => this.insert(app.fileManager.generateMarkdownLink(file, this.path())),
        m.link,
      ).open(),
    );
    this.imageInput = area.createEl('input', {
      type: 'file',
      attr: { accept: 'image/*', 'aria-label': m.image },
    });
    this.imageInput.hidden = true;
    this.imageInput.onchange = () => {
      const image = this.imageInput.files?.[0];
      if (image) void this.addImage(image);
      this.imageInput.value = '';
    };
    this.button(m.image, 'image-plus', () => this.imageInput.click());
    const toggle = this.button(m.preview, 'eye', () => {
      this.previewing = !this.previewing;
      toggle.setAttribute('aria-label', this.previewing ? m.source : m.preview);
      toggle.title = this.previewing ? m.source : m.preview;
      setIcon(toggle, this.previewing ? 'code' : 'eye');
      this.input.hidden = this.previewing || this.nativeReady;
      this.nativeHost.hidden = this.previewing || !this.nativeReady;
      this.preview.hidden = !this.previewing;
      if (this.previewing) void this.renderPreview();
      else this.focus();
    });
    this.toolHost = undefined;
    const tm = themeMessages(locale);
    const source = this.button(tm.source, 'code', () => {
      this.sourceMode = !this.sourceMode;
      source.setAttribute('aria-label', this.sourceMode ? tm.visual : tm.source);
      source.title = this.sourceMode ? tm.visual : tm.source;
      source.setAttribute('aria-pressed', String(this.sourceMode));
      void this.native?.setSource(this.sourceMode);
    });
    this.sourceButton = source;
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
        source.disabled = true;
        this.focus();
      });
  }

  private path(): string {
    return this.sourcePath ?? periodicLocation(dayjs(), DAILY, this.settings).file;
  }
  private button(label: string, icon: string, action: () => void): HTMLButtonElement {
    const button = (this.toolHost ?? this.footer).createEl('button', {
      attr: { 'aria-label': label, title: label },
      cls: 'lifeos-capture-tool',
    });
    setIcon(button, icon);
    button.onclick = () => {
      this.moreTools.open = false;
      action();
    };
    this.controls.push(button);
    return button;
  }
  private updateModes(): void {
    this.modes.forEach((button, i) =>
      button.setAttribute('aria-pressed', String(this.kind === (i ? 'task' : 'record'))),
    );
  }
  getText(): string {
    return this.nativeReady ? this.native!.getText() : this.input.value;
  }
  private setText(text: string): void {
    this.input.value = text;
    this.native?.setText(text);
    if (this.previewing) void this.renderPreview();
  }
  focus(): void {
    if (this.nativeReady) this.native?.focus();
    else this.input.focus();
  }
  private wrap(before: string, after: string): void {
    if (this.nativeReady) {
      this.native?.wrap(before, after);
      return;
    }
    const start = this.input.selectionStart;
    const end = this.input.selectionEnd;
    this.insert(`${before}${this.input.value.slice(start, end)}${after}`);
    if (start === end) this.input.setSelectionRange(start + before.length, start + before.length);
  }
  private insert(text: string): void {
    if (this.nativeReady) this.native?.insert(text);
    else this.input.setRangeText(text, this.input.selectionStart, this.input.selectionEnd, 'end');
    if (this.previewing) void this.renderPreview();
    else this.focus();
  }
  private async renderPreview(): Promise<void> {
    const version = ++this.previewVersion;
    this.renderScope?.unload();
    const scope = (this.renderScope = new Component());
    scope.load();
    const target = this.preview.createDiv();
    this.preview.replaceChildren(target);
    await MarkdownRenderer.render(this.app, this.getText(), target, this.path(), scope);
    if (version !== this.previewVersion) scope.unload();
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
    this.moreTools.inert = busy;
    if (busy) this.moreTools.open = false;
    this.native?.setBusy(busy);
    this.saveButton.disabled = busy || !this.ready;
    this.saveButton.textContent = busy ? this.m.saving : this.m.save;
    this.cancelButton.disabled = busy;
    this.controls.forEach((button) => {
      button.disabled =
        busy ||
        !this.ready ||
        (button === this.sourceButton && !this.nativeReady) ||
        (this.editing && this.modes.includes(button));
    });
  }
  setDraft(text: string, kind: QuickCaptureKind, editing = false, sourcePath?: string): void {
    this.editing = editing;
    this.sourcePath = sourcePath;
    this.input.value = text;
    this.native?.setText(text, true);
    this.kind = kind;
    this.updateModes();
    this.cancelButton.hidden = !editing;
    this.modes.forEach((button) => {
      button.disabled = editing;
      button.hidden = editing;
    });
    if (this.previewing) void this.renderPreview();
    else this.focus();
  }
  destroy(): void {
    this.closed = true;
    this.picker?.close();
    this.native?.destroy();
    this.previewVersion++;
    this.renderScope?.unload();
  }
}

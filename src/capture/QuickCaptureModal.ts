import { Component, type EventRef, Modal, Notice, Scope, TFile, setIcon } from 'obsidian';
import type LifeOS from '../main';
import { CaptureFilterBar } from './FilterBar';
import { InlineCaptureEdit } from './InlineEdit';
import { DeleteCaptureModal, renderRecord } from './RecordView';
import { ThemePicker } from './ThemePicker';
import { CaptureComposer } from './composer';
import { type QuickCaptureKind } from './content';
import { defaultCaptureDraft, defaultThemePaths, hasCaptureBody } from './defaults';
import { CaptureConflict, type CaptureRecord, filterRecords, revisedRecord } from './history';
import { sameCapture } from './interaction';
import { type CaptureMessages, captureMessages } from './messages';
import { captureToToday } from './quick-capture';
import { CaptureRepository } from './repository';
import { captureThemes } from './theme-catalog';
import type { CaptureTheme } from './theme-model';
import './index.less';

export class QuickCaptureModal extends Modal {
  private composer!: CaptureComposer;
  private repository: CaptureRepository;
  private m: CaptureMessages;
  private records: CaptureRecord[] = [];
  private themes: CaptureTheme[] = [];
  private themePicker?: ThemePicker;
  private filterBar!: CaptureFilterBar;
  private inlineEdit?: InlineCaptureEdit;
  private observer?: IntersectionObserver;
  private loadingMore = false;
  private list!: HTMLElement;
  private count!: HTMLElement;
  private renderScope?: Component;
  private subscriptions: EventRef[] = [];
  private reloadTimer?: ReturnType<typeof setTimeout>;
  private renderTimer?: ReturnType<typeof setTimeout>;
  private queryVersion = 0;
  private renderVersion = 0;
  private limit = 25;
  private busy = false;
  private pendingDefaults = false;
  private defaultDraft = '';
  private opened = false;
  private deleteModal?: DeleteCaptureModal;

  constructor(
    private readonly plugin: LifeOS,
    private readonly kind: QuickCaptureKind,
  ) {
    super(plugin.app);
    // Allow configured editor shortcuts to reach the focused unsaved draft.
    this.scope = new Scope(this.app.scope);
    this.scope.register([], 'Escape', () => {
      this.close();
      return false;
    });
    this.repository = new CaptureRepository(this.app, plugin.settings);
    this.m = captureMessages(plugin.getCurrentLocaleKey());
  }

  onOpen(): void {
    this.opened = true;
    this.modalEl.addClass('lifeos-quick-capture-modal');
    this.contentEl.dir = this.plugin.getCurrentLocaleKey().startsWith('ar') ? 'rtl' : 'ltr';
    this.modalEl.dir = this.plugin.getCurrentLocaleKey().toLowerCase().startsWith('ar') ? 'rtl' : 'ltr';
    this.setTitle(this.kind === 'task' ? `${this.m.title} · ${this.m.task}` : this.m.title);
    this.contentEl.createEl('p', {
      cls: 'lifeos-quick-capture-description',
      text: this.m.description,
    });
    const fullscreen = this.contentEl.createEl('button', {
      cls: 'lifeos-capture-fullscreen',
      attr: { 'aria-label': this.m.fullscreen, title: this.m.fullscreen },
    });
    setIcon(fullscreen, 'maximize');
    fullscreen.onclick = () => {
      const full = this.modalEl.hasClass('lifeos-capture-full');
      this.modalEl.toggleClass('lifeos-capture-full', !full);
      fullscreen.setAttribute('aria-label', full ? this.m.fullscreen : this.m.restore);
      fullscreen.title = full ? this.m.fullscreen : this.m.restore;
      setIcon(fullscreen, full ? 'maximize' : 'minimize');
    };
    this.composer = new CaptureComposer(
      this.app,
      this.plugin.settings,
      this.plugin.getCurrentLocaleKey(),
      this.contentEl,
      this.m,
      this.kind,
      () => this.save(),
      () => this.cancelEdit(),
    );
    this.pendingDefaults = defaultThemePaths(this.plugin.settings.quickCaptureDefaultThemes).length > 0;
    if (this.pendingDefaults) this.composer.setBusy(true);
    this.filterBar = new CaptureFilterBar(this.contentEl, this.m, this.plugin.getCurrentLocaleKey(), () => {
      this.limit = 25;
      this.scheduleRender();
    });
    const historyHeader = this.contentEl.createDiv('lifeos-capture-history-header');
    historyHeader.createEl('h3', { text: this.m.history });
    this.count = historyHeader.createSpan();
    const refresh = historyHeader.createEl('button', { text: this.m.refresh });
    refresh.onclick = () => {
      this.repository.invalidate();
      void this.reload();
    };
    this.list = this.contentEl.createDiv('lifeos-capture-list');
    this.list.setAttribute('aria-live', 'polite');
    const changed = (file: { path: string }) => {
      this.repository.invalidate(file.path);
      this.scheduleReload();
    };
    this.subscriptions.push(
      this.app.vault.on('create', changed),
      this.app.vault.on('modify', changed),
      this.app.vault.on('delete', changed),
    );
    this.subscriptions.push(
      this.app.vault.on('rename', (file, oldPath) => {
        this.repository.invalidate(file.path);
        this.repository.invalidate(oldPath);
        this.scheduleReload();
      }),
    );
    void this.reload();
  }

  private scheduleReload(): void {
    clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(() => {
      if (this.opened) void this.reload();
    }, 250);
  }
  private scheduleRender(): void {
    clearTimeout(this.renderTimer);
    this.renderTimer = setTimeout(() => {
      if (this.opened) void this.renderList();
    }, 150);
  }
  private async reload(): Promise<void> {
    const version = ++this.queryVersion;
    try {
      const [records, themes] = await Promise.all([
        this.repository.list(),
        captureThemes(this.app, this.plugin.settings),
      ]);
      if (!this.opened || version !== this.queryVersion) return;
      this.records = records;
      this.themes = themes;
      if (this.pendingDefaults) {
        this.resetNewDraft();
        this.pendingDefaults = false;
        this.composer.setBusy(false);
      }
      this.renderTags();
      await this.renderList();
    } catch (error) {
      if (this.opened) this.fail(error);
      if (this.opened && version === this.queryVersion && this.pendingDefaults) {
        this.pendingDefaults = false;
        this.composer.setBusy(false);
      }
    }
  }
  private renderTags(): void {
    this.filterBar.setTags(this.records.flatMap((record) => record.tags));
  }
  private async renderList(): Promise<void> {
    const version = ++this.renderVersion;
    this.renderScope?.unload();
    const scope = (this.renderScope = new Component());
    scope.load();
    this.observer?.disconnect();
    const scrollTop = this.list.scrollTop;
    this.list.empty();
    const matches = filterRecords(this.records, this.filterBar.value);
    this.count.textContent = `${matches.length} ${this.m.count}`;
    if (!matches.length && !this.inlineEdit) {
      this.list.createEl('p', {
        text: this.records.length ? this.m.noResults : this.m.empty,
        cls: 'lifeos-capture-empty',
      });
      return;
    }
    // A detached batch prevents old asynchronous Markdown renders from replacing a newer filter result.
    const batch = this.list.createDiv();
    const visible = matches.slice(0, this.limit);
    let editAttached = false;
    let lastDate = '';
    if (this.inlineEdit && !visible.some((record) => sameCapture(record, this.inlineEdit!.record))) {
      batch.createEl('h3', { text: this.inlineEdit.record.date, cls: 'lifeos-capture-date-heading' });
      batch.appendChild(this.inlineEdit.card);
      editAttached = true;
    }
    for (const record of visible) {
      if (!this.opened || version !== this.renderVersion) return;
      if (record.date !== lastDate) {
        batch.createEl('h3', { text: record.date, cls: 'lifeos-capture-date-heading' });
        lastDate = record.date;
      }
      if (this.inlineEdit && !editAttached && sameCapture(record, this.inlineEdit.record)) {
        batch.appendChild(this.inlineEdit.card);
        editAttached = true;
        continue;
      }
      await renderRecord(this.app, batch, record, this.m, scope, this.themes, this.plugin.getCurrentLocaleKey(), {
        edit: (card) => this.edit(record, card),
        associate: () => {
          if (this.busy) return;
          this.themePicker = new ThemePicker(
            this.app,
            this.plugin.settings,
            this.plugin.getCurrentLocaleKey(),
            () => record.text,
            async (text) => {
              let applied = false;
              await this.mutate(async () => {
                await this.repository.replace(record, revisedRecord(record, text));
                applied = true;
              });
              return applied;
            },
            (path) => this.openTheme(path),
          );
          this.themePicker.open();
        },
        openTheme: (path) => {
          void this.openTheme(path).catch((error) => this.fail(error));
        },
        remove: () => {
          if (this.busy) return;
          this.deleteModal = new DeleteCaptureModal(this.app, this.m, () =>
            this.mutate(() => this.repository.replace(record, null)),
          );
          this.deleteModal.open();
        },
        open: () => {
          void this.repository
            .open(record)
            .then(() => this.close())
            .catch((error) => this.fail(error));
        },
        toggle: (text) => this.mutate(() => this.repository.replace(record, text)),
      });
    }
    if (!this.opened || version !== this.renderVersion) return;
    this.list.scrollTop = scrollTop;
    const end = batch.createEl(matches.length > this.limit ? 'button' : 'p', {
      text: matches.length > this.limit ? this.m.more : this.m.end,
      cls: 'lifeos-capture-end',
    });
    if (matches.length > this.limit) {
      const loadMore = () => {
        if (this.loadingMore || this.busy || !this.opened || version !== this.renderVersion) return;
        this.loadingMore = true;
        this.limit += 25;
        void this.renderList().finally(() => {
          this.loadingMore = false;
        });
      };
      end.tabIndex = 0;
      end.onclick = loadMore;
      end.onkeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          loadMore();
        }
      };
      const Observer = this.list.ownerDocument.defaultView!.IntersectionObserver;
      this.observer = new Observer(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) loadMore();
        },
        { root: this.list, rootMargin: '200px' },
      );
      this.observer.observe(end);
    }
  }

  private async openTheme(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) throw new Error('theme missing');
    await this.app.workspace.getLeaf('tab').openFile(file);
    this.close();
  }

  private edit(record: CaptureRecord, card: HTMLElement): void {
    if (this.busy || this.inlineEdit) return;
    this.inlineEdit = new InlineCaptureEdit(
      this.app,
      this.plugin.settings,
      this.plugin.getCurrentLocaleKey(),
      this.m,
      record,
      card,
      async () => {
        const editor = this.inlineEdit;
        if (!editor || !editor.composer.getText().trim()) return;
        await this.mutate(async () => {
          await this.repository.replace(editor.record, revisedRecord(editor.record, editor.composer.getText().trim()));
          this.finishEdit();
        });
      },
      () => {
        this.finishEdit();
        void this.renderList();
      },
    );
  }
  private finishEdit(): void {
    this.inlineEdit?.destroy();
    this.inlineEdit = undefined;
  }
  private cancelEdit(): void {
    this.finishEdit();
    void this.renderList();
  }
  private async save(): Promise<void> {
    const text = this.composer.getText().trim();
    if (!text || this.busy || this.pendingDefaults || !hasCaptureBody(text, this.defaultDraft)) {
      if (!text) this.composer.focus();
      return;
    }
    await this.mutate(async () => {
      const file = await captureToToday(
        this.app,
        this.plugin.settings,
        this.plugin.getCurrentLocaleKey(),
        this.composer.kind,
        text,
        false,
      );
      this.repository.invalidate(file.path);
      // The record is already saved. A failed catalog refresh must never leave it in the draft.
      try {
        this.themes = await captureThemes(this.app, this.plugin.settings);
      } catch {
        this.themes = [];
      }
      this.resetNewDraft();
      this.limit = 25;
      this.list.scrollTop = 0;
    });
  }
  private resetNewDraft(): void {
    this.defaultDraft = defaultCaptureDraft(this.themes, this.plugin.settings.quickCaptureDefaultThemes);
    this.composer.setDraft(this.defaultDraft, this.kind);
  }
  private async mutate(action: () => Promise<void>): Promise<void> {
    if (this.busy || !this.opened) return;
    this.busy = true;
    this.composer.setBusy(true);
    this.inlineEdit?.composer.setBusy(true);
    try {
      await action();
      await this.reload();
    } catch (error) {
      this.fail(error);
    } finally {
      this.busy = false;
      if (this.opened) {
        this.composer.setBusy(false);
        this.inlineEdit?.composer.setBusy(false);
      }
    }
  }
  private fail(error: unknown): void {
    new Notice(error instanceof CaptureConflict ? this.m.conflict : this.m.failed);
  }

  onClose(): void {
    this.opened = false;
    this.queryVersion++;
    this.renderVersion++;
    clearTimeout(this.reloadTimer);
    clearTimeout(this.renderTimer);
    this.subscriptions.forEach((ref) => this.app.vault.offref(ref));
    this.subscriptions = [];
    this.renderScope?.unload();
    this.finishEdit();
    this.composer?.destroy();
    this.observer?.disconnect();
    this.filterBar?.destroy(this.contentEl.ownerDocument);
    this.deleteModal?.close();
    this.themePicker?.close();
    this.contentEl.empty();
  }
}

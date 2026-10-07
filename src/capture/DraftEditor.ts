import { type App, type EditorPosition, MarkdownView, type Menu, TFile, WorkspaceLeaf } from 'obsidian';

/** A draft view has file context for links, but no route to save a fragment into that file. */
class UnsavedMarkdownView extends MarkdownView {
  requestSave = () => {};
  async openDraft(): Promise<void> {
    await this.onOpen();
  }
  async save(): Promise<void> {}
  async onUnloadFile(): Promise<void> {}
}

export class DraftEditor {
  private leaf?: WorkspaceLeaf;
  private view?: UnsavedMarkdownView;
  private disposed = false;
  private previous: App['workspace']['activeEditor'];
  private context?: App['workspace']['activeEditor'];
  private listeners: (() => void)[] = [];
  private busy = false;

  constructor(
    private readonly app: App,
    private readonly host: HTMLElement,
    private readonly path: () => string,
    private readonly placeholder: string,
    private readonly changed: () => void,
    private readonly editorMenu?: (menu: Menu) => void,
  ) {
    // A null override restores the active leaf; the setter ignores MarkdownView.
    const previous = app.workspace.activeEditor;
    this.previous = previous instanceof MarkdownView ? null : previous;
  }

  async mount(): Promise<void> {
    // Obsidian exports this class at runtime but does not type the detached constructor.
    const DetachedLeaf = WorkspaceLeaf as unknown as new (app: App) => WorkspaceLeaf;
    const leaf = (this.leaf = new DetachedLeaf(this.app));
    const view = (this.view = new UnsavedMarkdownView(leaf));
    leaf.view = view;
    this.host.append(view.containerEl);
    view.load();
    await view.openDraft();
    await view.setState({ mode: 'source', source: false }, { history: false });
    if (this.disposed) return this.destroy();
    view.setViewData('', true);
    this.updateContext();
    const input = () => {
      this.changed();
      if (!view.editor.hasFocus()) return;
      const suggestions = (
        this.app.workspace as typeof this.app.workspace & {
          editorSuggest?: {
            trigger(editor: typeof view.editor, file: TFile | null, typed: boolean): void;
          };
        }
      ).editorSuggest;
      suggestions?.trigger(view.editor, view.file, true);
    };
    const activate = () => {
      if (this.context) this.app.workspace.activeEditor = this.context;
    };
    for (const [event, listener] of [
      ['input', input],
      ['focusin', activate],
    ] as const) {
      view.containerEl.addEventListener(event, listener);
      this.listeners.push(() => view.containerEl.removeEventListener(event, listener));
    }
    const content = view.containerEl.querySelector<HTMLElement>('.cm-content');
    content?.setAttribute('aria-label', this.placeholder);
    content?.setAttribute('data-placeholder', this.placeholder);
    if (this.editorMenu) {
      const ref = this.app.workspace.on('editor-menu', (menu, editor) => {
        if (!this.disposed && editor === view.editor) this.editorMenu?.(menu);
      });
      this.listeners.push(() => this.app.workspace.offref(ref));
    }
    this.setBusy(this.busy);
    this.focus();
  }

  private updateContext(): void {
    if (!this.view) return;
    // Context exists only in memory. Opening capture must never create or modify a daily note.
    const path = this.path();
    const file = Object.create(TFile.prototype) as TFile;
    Object.assign(file, {
      vault: this.app.vault,
      path,
      name: path.split('/').pop()!,
      basename: path.split('/').pop()!.replace(/\.md$/i, ''),
      extension: 'md',
      stat: { ctime: 0, mtime: 0, size: 0 },
    });
    this.view.file = file;
    // Workspace ignores MarkdownView instances assigned to activeEditor: detached
    // views are not active leaves. Supply file info and the mode hook commands use.
    const view = this.view;
    const context: NonNullable<App['workspace']['activeEditor']> & {
      getMode: () => ReturnType<MarkdownView['getMode']>;
    } = {
      app: this.app,
      file,
      editor: view.editor,
      get hoverPopover() {
        return view.hoverPopover;
      },
      set hoverPopover(value) {
        view.hoverPopover = value;
      },
      getMode: () => view.getMode(),
    };
    this.context = context;
    if (this.app.workspace.activeEditor?.editor === this.view.editor) this.app.workspace.activeEditor = this.context;
  }

  getText(): string {
    return this.view?.editor.getValue() ?? '';
  }
  setText(text: string, resetHistory = false): void {
    if (!this.view) return;
    this.updateContext();
    if (resetHistory) {
      this.view.setViewData(text, true);
      this.view.editor.setCursor(this.view.editor.offsetToPos(text.length));
    } else this.view.editor.setValue(text);
  }
  getSelection(): { anchor: EditorPosition; head: EditorPosition } | undefined {
    const editor = this.view?.editor;
    return (
      editor && {
        anchor: editor.getCursor('anchor'),
        head: editor.getCursor('head'),
      }
    );
  }
  async setSource(source: boolean): Promise<void> {
    if (!this.view) return;
    const selection = this.getSelection();
    const scroll = this.view.editor.getScrollInfo();
    await this.view.setState({ mode: 'source', source }, { history: false });
    if (this.disposed) return;
    if (selection) this.view.editor.setSelection(selection.anchor, selection.head);
    this.view.editor.scrollTo(scroll.left, scroll.top);
    this.setBusy(this.busy);
    this.focus();
  }
  insert(text: string): void {
    this.view?.editor.replaceSelection(text);
    this.changed();
    this.focus();
  }
  focus(): void {
    if (!this.busy && !this.disposed) this.view?.editor.focus();
  }
  setBusy(busy: boolean): void {
    this.busy = busy;
    this.host.inert = busy;
  }
  destroy(): void {
    this.disposed = true;
    this.listeners.splice(0).forEach((remove) => remove());
    if (this.app.workspace.activeEditor?.editor === this.view?.editor) this.app.workspace.activeEditor = this.previous;
    if (this.view) this.view.file = null;
    const leaf = this.leaf;
    this.leaf = undefined;
    leaf?.detach();
    this.view = undefined;
    this.context = undefined;
    this.host.empty();
  }
}

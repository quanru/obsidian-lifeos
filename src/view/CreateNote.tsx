import type { Locale } from 'antd/es/locale';
import { ItemView, type WorkspaceLeaf, debounce } from 'obsidian';
import React from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { CreateNote } from '../component/CreateNote';
import { AppContext } from '../context';
import type { PluginSettings } from '../type';

export const CREATE_NOTE = 'periodic-para';

export class CreateNoteView extends ItemView {
  settings: PluginSettings;
  root: Root;
  locale: Locale;
  constructor(leaf: WorkspaceLeaf, settings: PluginSettings, locale: Locale) {
    super(leaf);
    this.settings = settings;
    this.locale = locale;
  }

  getViewType() {
    return CREATE_NOTE;
  }

  getDisplayText() {
    return 'LifeOS';
  }

  getIcon(): string {
    return 'zap';
  }

  onResize = debounce(async () => {
    if ((this.app as any).isMobile) {
      return;
    }

    await this.onClose();
    await this.onOpen();
  }, 500);

  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass('periodic-para-create-note');
    this.root = createRoot(this.containerEl.children[1]);
    this.root.render(
      <AppContext.Provider
        value={{
          app: this.app,
          settings: this.settings,
          locale: this.locale,
        }}
      >
        <CreateNote width={this.containerEl.innerWidth} />
      </AppContext.Provider>,
    );
  }

  async onClose() {
    this.root.unmount();
  }
}

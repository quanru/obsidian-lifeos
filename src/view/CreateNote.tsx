import type { Locale } from 'antd/es/locale';
import { ItemView, Platform, type WorkspaceLeaf, debounce } from 'obsidian';
import React from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { CreateNote } from '../component/CreateNote';
import { AppContext } from '../context';
import type LifeOS from '../main';
import type { PluginSettings } from '../type';

export const CREATE_NOTE = 'periodic-para';

export class CreateNoteView extends ItemView {
  settings: PluginSettings;
  root: Root;
  locale: Locale;
  plugin: LifeOS;

  constructor(leaf: WorkspaceLeaf, settings: PluginSettings, locale: Locale, plugin: LifeOS) {
    super(leaf);
    this.settings = settings;
    this.locale = locale;
    this.plugin = plugin;
  }

  getViewType() {
    return CREATE_NOTE;
  }

  getDisplayText() {
    return 'LifeOS';
  }

  getIcon(): string {
    return 'file-plus';
  }

  onResize = debounce(async () => {
    if (Platform.isMobile) {
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
          settings: this.plugin.settings,
          locale: this.plugin.locale,
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

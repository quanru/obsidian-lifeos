import { ItemView, WorkspaceLeaf, debounce } from 'obsidian';
import * as React from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { AddTemplate } from '../component/AddTemplate';
import { AppContext } from '../context';
import type { PluginSettings } from 'src/type';

export const VIEW_TYPE = 'periodic-para';

export class PeriodicPARAView extends ItemView {
  settings: PluginSettings;
  root: Root;
  constructor(leaf: WorkspaceLeaf, settings: PluginSettings) {
    super(leaf);
    this.settings = settings;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return 'Periodic PARA';
  }

  getIcon(): string {
    return 'zap';
  }

  onResize = debounce(async () => {
    if ((this.app as any).isMobile) {
      return;
    }

    this.onClose();
    this.onOpen();
  }, 500);

  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass('periodic-para');
    this.root = createRoot(this.containerEl.children[1]);
    this.root.render(
      <AppContext.Provider
        value={{
          app: this.app,
          settings: this.settings,
          width: this.containerEl.innerWidth,
        }}
      >
        <AddTemplate></AddTemplate>
      </AppContext.Provider>
    );
  }

  async onClose() {
    this.root.unmount();
  }
}

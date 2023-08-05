import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { AddTemplate } from '../component/AddTemplate';
import { AppContext } from '../context';
import type { PluginSettings } from 'src/type';

const VIEW_TYPE_EXAMPLE = 'example-view';

export class AddTemplateView extends ItemView {
  settings: PluginSettings;
  constructor(leaf: WorkspaceLeaf, settings: PluginSettings) {
    super(leaf);
    this.settings = settings;
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return 'Example view';
  }

  async onOpen() {
    const root = createRoot(this.containerEl.children[1]);
    root.render(
      <AppContext.Provider
        value={{
          app: this.app,
          settings: this.settings,
        }}
      >
        <AddTemplate />
      </AppContext.Provider>
    );
  }

  async onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
  }
}

import {
  App,
  Editor,
  MarkdownPostProcessorContext,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginManifest,
  PluginSettingTab,
  Setting,
} from 'obsidian';
import {
  DataviewApi,
  getAPI,
  isPluginEnabled,
} from 'obsidian-dataview';

import TaskRecordList from 'src/views/TaskRecordList';
import TaskDoneList from 'src/views/TaskDoneList';
import AreaList from 'src/views/AreaList';
import ProjectList from 'src/views/ProjectList';
import { Project } from 'src/para/Project';
import { Area } from 'src/para/Area';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: 'default',
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;
  dataviewAPI: DataviewApi | undefined;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    if (!isPluginEnabled(app)) {
      new Notice('You need to install dataview first!');
      throw Error('dataview is not available!');
    }

    this.app = app;
    this.dataviewAPI = getAPI(app);

    if (!this.dataviewAPI) {
      new Notice('Dataview API enable failed!');
      throw Error('dataview api enable failed!');
    }
  }

  async onload() {
    await this.loadSettings();
    this.loadGlobalHelpers();

    // This creates an icon in the left ribbon.
    const ribbonIconEl = this.addRibbonIcon(
      'dice',
      'Sample Plugin',
      (evt: MouseEvent) => {
        // Called when the user clicks the icon.
        new Notice('This is a notice!');
      }
    );
    // Perform additional things with the ribbon
    ribbonIconEl.addClass('my-plugin-ribbon-class');

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const statusBarItemEl = this.addStatusBarItem();
    statusBarItemEl.setText('Status Bar Text');

    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: 'open-sample-modal-simple',
      name: 'Open sample modal (simple)',
      callback: () => {
        new SampleModal(this.app).open();
      },
    });
    // This adds an editor command that can perform some operation on the current editor instance
    this.addCommand({
      id: 'sample-editor-command',
      name: 'Sample editor command',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        console.log(editor.getSelection());
        editor.replaceSelection('Sample Editor Command');
      },
    });
    // This adds a complex command that can check whether the current state of the app allows execution of the command
    this.addCommand({
      id: 'open-sample-modal-complex',
      name: 'Open sample modal (complex)',
      checkCallback: (checking: boolean) => {
        // Conditions to check
        const markdownView =
          this.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView) {
          // If checking is true, we're simply "checking" if the command can be run.
          // If checking is false, then we want to actually perform the operation.
          if (!checking) {
            new SampleModal(this.app).open();
          }

          // This command will only show up in Command Palette when the check function returns true
          return true;
        }
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this));

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
      console.log('click', evt);
    });

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(
      window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000)
    );

    const views = {
      ProjectList,
      AreaList,
      TaskRecordList,
      TaskDoneList,
    }

    this.registerMarkdownCodeBlockProcessor(
      'periodic-para',
      (
        source: keyof typeof views,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
      ) => {
        if (!source) {
          throw new Error(`Please provide a view name!`);
        }

        if (!Object.keys(views).includes(source)) {
          throw new Error(`There is no view for ${source} in this plugin`);
        } 
        
        return views[source].bind(this)(source, el, ctx);
      }
    );
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  loadGlobalHelpers() {
    (window as any).PeriodicPARA = {};
    (window as any).PeriodicPARA.Project = new Project(this.app);
    (window as any).PeriodicPARA.Area = new Area(this.app);
  }
}

class SampleModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.setText('Woah!');
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

    new Setting(containerEl)
      .setName('Setting #1')
      .setDesc("It's a secret")
      .addText((text) =>
        text
          .setPlaceholder('Enter your secret')
          .setValue(this.plugin.settings.mySetting)
          .onChange(async (value) => {
            console.log('Secret: ' + value);
            this.plugin.settings.mySetting = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

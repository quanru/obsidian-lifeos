import type { App } from 'obsidian';
import type { PluginSettings } from '../type';
import { Date } from '../periodic/Date';
import { File } from '../periodic/File';

export abstract class Base {
  dir: string;
  app: App;
  settings: PluginSettings;
  file: File;
  date: Date;

  constructor(dir: string, app: App, settings: PluginSettings) {
    this.dir = dir;
    this.app = app;
    this.settings = settings;
    this.date = new Date(this.app, this.settings);
    this.file = new File(this.app, this.settings);
  }

  snapshot(dir = this.dir) {
    return this.file.list(dir);
  }
}

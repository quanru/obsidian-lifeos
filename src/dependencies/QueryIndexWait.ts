import { type App, MarkdownRenderChild } from 'obsidian';
import { dataviewState } from './dataview';

/** A query opened during startup should recover as soon as Dataview is ready. */
export class QueryIndexWait extends MarkdownRenderChild {
  private stopped = false;
  constructor(
    container: HTMLElement,
    private app: App,
    private refresh: () => void,
  ) {
    super(container);
  }
  onload() {
    this.registerEvent(this.app.metadataCache.on('dataview:index-ready' as 'changed', () => this.check()));
    this.check();
  }
  private check() {
    if (this.stopped || dataviewState(this.app) !== 'ready') return;
    this.retry();
  }
  retry = () => {
    if (this.stopped) return;
    this.stopped = true;
    this.unload();
    this.refresh();
  };
  onunload() {
    this.stopped = true;
  }
}

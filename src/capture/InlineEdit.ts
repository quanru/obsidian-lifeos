import type { App } from 'obsidian';
import type { PluginSettings } from '../type';
import { CaptureComposer } from './composer';
import type { CaptureRecord } from './history';
import { interactionMessages } from './interaction-messages';
import type { CaptureMessages } from './messages';

export class InlineCaptureEdit {
  readonly composer: CaptureComposer;
  constructor(
    app: App,
    settings: PluginSettings,
    locale: string,
    m: CaptureMessages,
    readonly record: CaptureRecord,
    readonly card: HTMLElement,
    save: () => Promise<void>,
    cancel: () => void,
  ) {
    card.empty();
    card.ondblclick = null;
    card.addClass('lifeos-capture-card-editing');
    card.createEl('small', { text: interactionMessages(locale).editing });
    this.composer = new CaptureComposer(app, settings, locale, card, m, record.kind, save, cancel);
    this.composer.setDraft(record.text, record.kind, true, record.path);
  }
  destroy(): void {
    this.composer.destroy();
  }
}

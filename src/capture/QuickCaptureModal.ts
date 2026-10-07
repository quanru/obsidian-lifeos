import { Modal, Notice, Setting, TextAreaComponent } from 'obsidian';
import { getFeatureI18n } from '../feature-i18n';
import type LifeOS from '../main';
import { type QuickCaptureKind } from './content';
import { captureToToday } from './quick-capture';

import './index.less';

export class QuickCaptureModal extends Modal {
  private value = '';
  private isWorking = false;
  private textArea?: TextAreaComponent;

  constructor(
    private readonly plugin: LifeOS,
    private readonly kind: QuickCaptureKind,
  ) {
    super(plugin.app);
  }

  onOpen(): void {
    const locale = this.plugin.getCurrentLocaleKey();
    const t = getFeatureI18n(locale);
    const title = this.kind === 'task' ? t.quickTaskTitle : t.quickRecordTitle;
    const placeholder = this.kind === 'task' ? t.quickTaskPlaceholder : t.quickRecordPlaceholder;

    this.modalEl.addClass('lifeos-quick-capture-modal');
    this.modalEl.dir = locale.toLowerCase().startsWith('ar') ? 'rtl' : 'ltr';
    this.setTitle(title);
    this.contentEl.createEl('p', {
      cls: 'lifeos-quick-capture-description',
      text: t.quickCaptureDescription,
    });

    new Setting(this.contentEl).addTextArea((textArea) => {
      this.textArea = textArea;
      textArea
        .setPlaceholder(placeholder)
        .setValue(this.value)
        .onChange((value) => {
          this.value = value;
        });
      textArea.inputEl.rows = this.kind === 'task' ? 3 : 5;
      textArea.inputEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          void this.submit();
        }
      });
    });

    new Setting(this.contentEl).addButton((button) => {
      button
        .setCta()
        .setButtonText(t.quickCaptureSubmit)
        .onClick(async () => {
          await this.submit(button);
        });
    });

    window.setTimeout(() => this.textArea?.inputEl.focus(), 0);
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private async submit(button?: {
    setButtonText: (text: string) => unknown;
    setDisabled: (value: boolean) => unknown;
  }) {
    const locale = this.plugin.getCurrentLocaleKey();
    const t = getFeatureI18n(locale);
    const text = this.value.trim();

    if (!text) {
      new Notice(t.quickCaptureEmpty);
      this.textArea?.inputEl.focus();
      return;
    }
    if (this.isWorking) return;

    this.isWorking = true;
    button?.setDisabled(true);
    button?.setButtonText(t.quickCaptureWorking);

    try {
      await captureToToday(this.app, this.plugin.settings, locale, this.kind, text);
      new Notice(t.quickCaptureSuccess);
      this.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`${t.quickCaptureFailed}: ${message}`);
      button?.setDisabled(false);
      button?.setButtonText(t.quickCaptureSubmit);
      this.isWorking = false;
    }
  }
}

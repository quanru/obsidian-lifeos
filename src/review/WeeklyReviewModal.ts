import dayjs from 'dayjs';
import { Component, MarkdownRenderer, Modal, Notice, Setting } from 'obsidian';
import type LifeOS from '../main';
import { renderReview } from './content';
import { getReviewI18n } from './i18n';
import { collectWeeklyReview, saveWeeklyReview, weeklyReviewPath } from './weekly-review';
import './index.less';

export class WeeklyReviewModal extends Modal {
  private offset = 0;
  private working = false;
  private generation = 0;
  private renderer?: Component;
  private readonly today = dayjs();

  constructor(private readonly plugin: LifeOS) {
    super(plugin.app);
  }

  onOpen() {
    this.modalEl.addClass('lifeos-weekly-review-modal');
    void this.render();
  }

  onClose() {
    this.generation++;
    this.renderer?.unload();
    this.contentEl.empty();
  }

  private async render() {
    const generation = ++this.generation;
    this.renderer?.unload();
    this.renderer = new Component();
    this.renderer.load();
    const locale = this.plugin.getCurrentLocaleKey();
    const t = getReviewI18n(locale);
    this.modalEl.dir = locale.toLowerCase().startsWith('ar') ? 'rtl' : 'ltr';
    const date = this.today.add(this.offset, 'week');
    this.setTitle(t.title);
    this.contentEl.empty();
    this.contentEl.createEl('p', { text: t.description, cls: 'lifeos-review-description' });
    new Setting(this.contentEl).setName(t.week).addDropdown((dropdown) => {
      dropdown
        .addOption('0', t.current)
        .addOption('-1', t.previous)
        .setValue(String(this.offset))
        .setDisabled(this.working)
        .onChange((value) => {
          this.offset = Number(value);
          void this.render();
        });
    });
    const preview = this.contentEl.createDiv({ cls: 'lifeos-review-preview', text: t.loading });
    try {
      const data = await collectWeeklyReview(this.app, this.plugin.settings, date);
      if (generation !== this.generation) return;
      preview.empty();
      await MarkdownRenderer.render(
        this.app,
        renderReview(data, t, true),
        preview,
        weeklyReviewPath(date, this.plugin.settings),
        this.renderer,
      );
      if (generation !== this.generation) return;
      new Setting(this.contentEl).addButton((button) => {
        button
          .setCta()
          .setButtonText(t.save)
          .onClick(async () => {
            if (this.working) return;
            this.working = true;
            button.setDisabled(true).setButtonText(t.saving);
            try {
              await saveWeeklyReview(this.app, this.plugin.settings, date, locale);
              new Notice(t.saved);
              this.close();
            } catch (error) {
              new Notice(`${t.failed}: ${error instanceof Error ? error.message : String(error)}`);
              this.working = false;
              button.setDisabled(false).setButtonText(t.save);
            }
          });
      });
    } catch (error) {
      if (generation === this.generation)
        preview.setText(`${t.failed}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

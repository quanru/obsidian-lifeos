import { WORKSPACE_LANGUAGES } from './locale';
import dayjs from 'dayjs';
import { Modal, Notice, Setting, TFile } from 'obsidian';
import { QuickCaptureModal } from '../capture/QuickCaptureModal';
import { DAILY } from '../constant';
import { getFeatureI18n } from '../feature-i18n';
import type LifeOS from '../main';
import { createPeriodicFile } from '../util';
import {
  type WorkspaceLocale,
  type WorkspaceMode,
  getBasicTemplatePlans,
  getLocalizedWorkspaceSettings,
  getWorkspaceModeGuide,
  normalizeWorkspaceLocale,
} from './templates';
import {
  type WorkspaceProfile,
  type WorkspaceSetupResult,
  initializeWorkspace,
  readWorkspaceProfile,
  removeUntouchedExamples,
} from './workspace';

import './index.less';

export class OnboardingModal extends Modal {
  private mode: WorkspaceMode;
  private locale: WorkspaceLocale;
  private includeExamples = true;
  private isWorking = false;
  private profile: WorkspaceProfile | null = null;

  constructor(private readonly plugin: LifeOS) {
    super(plugin.app);
    this.mode = plugin.settings.usePARANotes ? 'para' : 'periodic';
    this.locale = normalizeWorkspaceLocale(plugin.getCurrentLocaleKey());
  }

  onOpen(): void {
    this.modalEl.addClass('lifeos-onboarding-modal');
    void this.prepare();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private async prepare(): Promise<void> {
    this.profile = await readWorkspaceProfile(this.app);
    if (this.profile) {
      this.mode = this.profile.template;
      this.locale = this.profile.locale;
    }
    this.renderSetup();
  }

  private renderSetup(): void {
    const t = getFeatureI18n(this.locale);
    this.modalEl.dir = this.locale === 'ar' ? 'rtl' : 'ltr';
    this.contentEl.empty();
    this.setTitle(t.setupTitle);
    this.contentEl.createEl('p', { cls: 'lifeos-onboarding-description', text: t.setupDescription });

    if (this.profile) {
      this.contentEl.createDiv({ cls: 'lifeos-onboarding-lock', text: t.setupLocked });
    }

    new Setting(this.contentEl)
      .setName(t.setupLanguage)
      .setDesc(t.setupLanguageDescription)
      .addDropdown((dropdown) => {
        Object.entries(WORKSPACE_LANGUAGES).forEach(([key, label]) => dropdown.addOption(key, label));
        dropdown
          .setValue(this.locale)
          .setDisabled(Boolean(this.profile))
          .onChange((value) => {
            this.locale = value as WorkspaceLocale;
            this.renderSetup();
          });
      });

    new Setting(this.contentEl)
      .setName(t.setupMode)
      .setDesc(this.mode === 'para' ? t.setupParaDescription : t.setupPeriodicOnlyDescription)
      .addDropdown((dropdown) => {
        dropdown
          .addOption('para', t.setupPara)
          .addOption('periodic', t.setupPeriodicOnly)
          .setValue(this.mode)
          .setDisabled(Boolean(this.profile))
          .onChange((value) => {
            this.mode = value as WorkspaceMode;
            this.renderSetup();
          });
      });

    const guide = getWorkspaceModeGuide(this.mode, this.locale);
    const guideEl = this.contentEl.createDiv({ cls: 'lifeos-onboarding-fit' });
    this.addGuideRow(guideEl, t.setupBestFor, guide.bestFor);
    this.addGuideRow(guideEl, t.setupNotFor, guide.notFor);
    this.addGuideRow(guideEl, t.setupDailyFlow, guide.dailyFlow);

    new Setting(this.contentEl)
      .setName(t.setupIncludeExamples)
      .setDesc(t.setupIncludeExamplesDescription)
      .addToggle((toggle) => {
        toggle.setValue(this.includeExamples).onChange((value) => {
          this.includeExamples = value;
          this.renderSetup();
        });
      });

    this.contentEl.createDiv({ cls: 'lifeos-onboarding-safety', text: t.setupSafety });
    this.contentEl.createEl('h3', { text: t.setupPreview });
    const previewEl = this.contentEl.createEl('ul', { cls: 'lifeos-onboarding-preview' });
    const previewSettings = this.getSetupSettings();
    getBasicTemplatePlans(previewSettings, this.mode, this.locale, {
      includeGuide: true,
      includeExample: this.includeExamples,
    }).forEach((plan) => previewEl.createEl('li', { text: plan.path }));

    new Setting(this.contentEl)
      .addButton((button) => {
        button.setButtonText(t.setupLater).onClick(async () => {
          await this.plugin.saveSettings({ ...this.plugin.settings, onboardingVersion: 1 });
          this.close();
        });
      })
      .addButton((button) => {
        button
          .setCta()
          .setButtonText(t.setupSubmit)
          .onClick(async () => {
            if (this.isWorking) return;
            this.isWorking = true;
            button.setDisabled(true).setButtonText(t.setupWorking);
            try {
              const settings = {
                ...this.getSetupSettings(),
                onboardingVersion: 1,
                usePeriodicNotes: true,
                usePARANotes: this.mode === 'para',
              };
              const result = await initializeWorkspace(this.app, settings, this.mode, this.locale, {
                includeExamples: this.includeExamples,
              });
              await this.plugin.saveSettings(settings);
              await createPeriodicFile(dayjs(), DAILY, settings, this.app, false, this.locale);
              new Notice(t.setupSuccess(result.created.length, result.skipped.length));
              this.renderCompletion(result);
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              new Notice(`${t.setupFailed}: ${message}`);
              button.setDisabled(false).setButtonText(t.setupSubmit);
              this.isWorking = false;
            }
          });
      });
  }

  private addGuideRow(parent: HTMLElement, label: string, value: string): void {
    const row = parent.createDiv({ cls: 'lifeos-onboarding-fit-row' });
    row.createEl('strong', { text: label });
    row.createEl('span', { text: value });
  }

  private getSetupSettings() {
    if (this.profile) return this.plugin.settings;
    return getLocalizedWorkspaceSettings(this.plugin.settings, this.locale);
  }

  private renderCompletion(result: WorkspaceSetupResult): void {
    const t = getFeatureI18n(this.locale);
    this.modalEl.dir = this.locale === 'ar' ? 'rtl' : 'ltr';
    this.contentEl.empty();
    this.setTitle(t.setupCompleteTitle);
    this.contentEl.createEl('p', { cls: 'lifeos-onboarding-description', text: t.setupCompleteDescription });

    const summary = this.contentEl.createDiv({ cls: 'lifeos-onboarding-summary' });
    summary.createEl('strong', { text: t.setupSuccess(result.created.length, result.skipped.length) });
    summary.createEl('span', { text: result.startPath });

    const actions = this.contentEl.createDiv({ cls: 'lifeos-onboarding-actions' });
    this.addAction(actions, t.setupOpenGuide, async () => {
      await this.openPath(result.startPath);
      this.close();
    });
    this.addAction(actions, t.setupOpenToday, async () => {
      await createPeriodicFile(dayjs(), DAILY, this.plugin.settings, this.app, false, this.locale);
      this.close();
    });
    this.addAction(actions, t.setupQuickRecord, async () => {
      this.close();
      new QuickCaptureModal(this.plugin, 'record').open();
    });
    this.addAction(actions, t.setupQuickTask, async () => {
      this.close();
      new QuickCaptureModal(this.plugin, 'task').open();
    });

    if (result.examplePaths.length > 0) {
      this.addAction(actions, t.setupRemoveExamples, async (button) => {
        const cleanup = await removeUntouchedExamples(this.app, this.mode, this.locale);
        new Notice(cleanup.removed.length > 0 ? t.setupExamplesRemoved : t.setupExamplesPreserved);
        if (cleanup.removed.length > 0) button.remove();
      });
    }
  }

  private addAction(parent: HTMLElement, label: string, action: (button: HTMLButtonElement) => Promise<void>): void {
    const button = parent.createEl('button', { cls: 'mod-cta', text: label });
    button.addEventListener('click', () => void action(button));
  }

  private async openPath(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) await this.app.workspace.getLeaf(false).openFile(file);
  }
}

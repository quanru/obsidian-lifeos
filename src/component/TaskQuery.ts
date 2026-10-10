import { dependencyMessages } from '../dependencies/messages';
import { normalizeWorkspaceLocale } from '../onboarding/locale';
import { Component, MarkdownRenderChild, type App, type MarkdownPostProcessorContext } from 'obsidian';

/** Re-run the query after Dataview commits its index, rather than reusing old tasks. */
export class TaskQuery extends MarkdownRenderChild {
  private stopped = true;
  private pending = false;
  private running?: Promise<void>;
  private rendered?: Component;

  constructor(
    container: HTMLElement,
    private readonly app: App,
    private readonly render: (container: HTMLElement, component: Component) => Promise<void>,
    private readonly failed: (container: HTMLElement) => void,
  ) {
    super(container);
  }

  onload() {
    this.stopped = false;
    this.registerEvent(this.app.metadataCache.on('dataview:metadata-change' as 'changed', () => void this.refresh()));
    this.registerEvent(this.app.metadataCache.on('dataview:index-ready' as 'changed', () => void this.refresh()));
    this.registerEvent(this.app.metadataCache.on('changed', () => void this.refresh()));
    this.registerEvent(this.app.vault.on('rename', () => void this.refresh()));
    this.registerEvent(this.app.vault.on('delete', () => void this.refresh()));
    void this.refresh();
  }

  refresh(): Promise<void> {
    if (this.stopped) return Promise.resolve();
    this.pending = true;
    if (this.running) return this.running;
    this.running = this.renderPending().finally(() => {
      this.running = undefined;
    });
    return this.running;
  }

  private async renderPending() {
    while (this.pending && !this.stopped) {
      this.pending = false;
      const container = this.containerEl.ownerDocument.createElement('div');
      const component = this.addChild(new Component());
      try {
        await this.render(container, component);
      } catch {
        this.failed(container);
      }
      if (this.stopped || this.pending) {
        this.removeChild(component);
        continue;
      }
      if (this.rendered) this.removeChild(this.rendered);
      this.rendered = component;
      this.containerEl.replaceChildren(container);
    }
  }

  onunload() {
    this.stopped = true;
    this.pending = false;
  }
}

const queryErrors: Record<string, string> = {
  en: 'Could not refresh the task query.',
  'zh-cn': '无法刷新任务查询。',
  'zh-tw': '無法重新整理任務查詢。',
  de: 'Die Aufgabenabfrage konnte nicht aktualisiert werden.',
  es: 'No se pudo actualizar la consulta de tareas.',
  fr: 'Impossible d’actualiser la requête des tâches.',
  pt: 'Não foi possível atualizar a consulta de tarefas.',
  ja: 'タスクのクエリを更新できませんでした。',
  ko: '작업 쿼리를 새로 고칠 수 없습니다.',
  ar: 'تعذّر تحديث استعلام المهام.',
};

export function renderTaskQuery(
  app: App,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  render: (container: HTMLElement, component: Component) => Promise<void>,
  locale: string,
) {
  const query = new TaskQuery(el.createDiv(), app, render, (container) => {
    container.empty();
    container.createEl('p', { text: queryErrors[normalizeWorkspaceLocale(locale)] || queryErrors.en });
    const retry = container.createEl('button', { text: dependencyMessages(locale).retry });
    retry.onclick = () => void query.refresh();
  });
  ctx.addChild(query);
  return query.refresh();
}

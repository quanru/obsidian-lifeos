import type { CaptureFilter } from './history';
import { type CaptureDatePreset, captureDateRange } from './interaction';
import { interactionMessages } from './interaction-messages';
import type { CaptureMessages } from './messages';

export class CaptureFilterBar {
  private state: CaptureFilter = { keyword: '', tags: [], from: '', to: '' };
  private preset: CaptureDatePreset = 'all';
  private options: HTMLDivElement;
  private summary: HTMLElement;
  constructor(
    host: HTMLElement,
    private m: CaptureMessages,
    locale: string,
    private changed: () => void,
  ) {
    const t = interactionMessages(locale);
    const bar = host.createDiv('lifeos-capture-filters');
    const search = bar.createEl('input', { type: 'search', attr: { 'aria-label': m.search, placeholder: m.search } });
    const tags = bar.createEl('details', { cls: 'lifeos-capture-tag-select' });
    this.summary = tags.createEl('summary', { text: t.allTags, attr: { 'aria-label': m.tags } });
    this.options = tags.createDiv('lifeos-capture-tag-options');
    const date = bar.createEl('select', { attr: { 'aria-label': t.dateFilter } });
    for (const [value, text] of Object.entries({
      all: t.allDates,
      today: t.today,
      '7d': t.week,
      '30d': t.month,
      custom: t.custom,
    }))
      date.createEl('option', { text, value });
    const clear = bar.createEl('button', { text: m.clear });
    clear.hidden = true;
    const range = host.createDiv('lifeos-capture-date-range');
    range.hidden = true;
    const inputs = {} as Record<'from' | 'to', HTMLInputElement>;
    const emit = () => {
      this.summary.textContent = this.state.tags.length
        ? this.state.tags.map((tag) => `#${tag}`).join(', ')
        : t.allTags;
      clear.hidden = !this.state.keyword && !this.state.tags.length && this.preset === 'all';
      range.hidden = this.preset !== 'custom';
      this.changed();
    };
    for (const key of ['from', 'to'] as const) {
      inputs[key] = range
        .createEl('label', { text: m[key] })
        .createEl('input', { type: 'date', attr: { 'aria-label': m[key] } });
      inputs[key].onchange = () => {
        this.state[key] = inputs[key].value;
        inputs.from.max = this.state.to;
        inputs.to.min = this.state.from;
        emit();
      };
    }
    search.oninput = () => {
      this.state.keyword = search.value;
      emit();
    };
    date.onchange = () => {
      this.preset = date.value as CaptureDatePreset;
      this.state = { ...this.state, ...captureDateRange(this.preset) };
      inputs.from.value = this.state.from;
      inputs.to.value = this.state.to;
      inputs.from.max = this.state.to;
      inputs.to.min = this.state.from;
      emit();
    };
    clear.onclick = () => {
      this.state = { keyword: '', tags: [], from: '', to: '' };
      this.preset = 'all';
      search.value = '';
      date.value = 'all';
      inputs.from.value = '';
      inputs.to.value = '';
      inputs.from.max = '';
      inputs.to.min = '';
      this.options.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
        input.checked = false;
      });
      emit();
    };
    this.options.addEventListener('change', (event) => {
      const input = event.target as HTMLInputElement;
      if (input.type !== 'checkbox') return;
      this.state.tags = input.checked
        ? [...this.state.tags, input.value]
        : this.state.tags.filter((tag) => tag !== input.value);
      emit();
    });
    bar.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && tags.open) {
        tags.open = false;
        event.preventDefault();
        event.stopPropagation();
        this.summary.focus();
      }
    });
    host.ownerDocument.addEventListener(
      'pointerdown',
      (this.outside = (event) => {
        if (!tags.contains(event.target as Node)) tags.open = false;
      }),
    );
  }
  private outside: (event: PointerEvent) => void;
  get value(): CaptureFilter {
    return { ...this.state, tags: [...this.state.tags] };
  }
  setTags(all: string[]): void {
    this.options.empty();
    const tags = [...new Set([...all, ...this.state.tags])].sort();
    for (const tag of tags) {
      const label = this.options.createEl('label');
      const check = label.createEl('input', { type: 'checkbox', value: tag });
      check.checked = this.state.tags.includes(tag);
      label.createSpan({ text: `#${tag}` });
    }
    if (!tags.length) this.options.createSpan({ text: '—' });
  }
  destroy(doc: Document): void {
    doc.removeEventListener('pointerdown', this.outside);
  }
}

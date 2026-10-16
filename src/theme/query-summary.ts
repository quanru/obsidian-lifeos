import { normalizeWorkspaceLocale } from '../onboarding/locale';
import './query-summary.less';

type QueryKind = 'open' | 'tasks' | 'records' | 'files';

/** Keep the result and its inclusion rules together, including when no rows match. */
export function renderThemeQuerySummary(
  container: HTMLElement,
  locale: string,
  tags: string[],
  count: number,
  kind: QueryKind,
) {
  const chinese = normalizeWorkspaceLocale(locale).startsWith('zh');
  const labels = chinese
    ? { open: '未完成任务', tasks: '任务', records: '记录', files: '资料' }
    : { open: 'Open tasks', tasks: 'Tasks', records: 'Records', files: 'Resources' };
  const details = container.createEl('details', { cls: 'lifeos-theme-query-summary' });
  details.createEl('summary', { text: `${labels[kind]} · ${count} · ${chinese ? '收录规则' : 'Inclusion rules'}` });
  details.createEl('p', {
    text: `${chinese ? '匹配任一标签：' : 'Match any tag: '}${tags.map((tag) => `#${tag}`).join(' · ')}`,
  });
  details.createEl('p', {
    text:
      kind === 'files'
        ? chinese
          ? '收录带主题标签的非周期笔记；排除当前页、主题索引和模板。'
          : 'Tagged non-periodic notes; excludes this page, theme indexes and templates.'
        : chinese
          ? '条目本身需带主题标签；日记只收录记录标题下的条目，排除习惯统计、主题索引和模板。'
          : 'Each item must carry a theme tag. Daily notes use the capture section; habits, theme indexes and templates are excluded.',
  });
  if (kind === 'open')
    details.createEl('p', {
      text: chinese
        ? '只显示未完成任务；勾选会写回来源笔记。'
        : 'Only unfinished tasks. Checking a task updates its source note.',
    });
  if (!count)
    container.createEl('p', {
      cls: 'lifeos-theme-query-empty',
      text:
        kind === 'files'
          ? chinese
            ? '还没有关联资料。给资料笔记的 tags 属性添加上方任一标签。'
            : 'No resources yet. Add one of the tags above to a resource note’s tags property.'
          : kind === 'open'
            ? chinese
              ? '没有待办任务。可在快速记录中切换到任务并关联此主题。'
              : 'No open tasks. Switch Quick capture to Task and associate this theme to add one.'
            : chinese
              ? '还没有匹配条目。可在快速记录中关联此主题，再保存记录或任务。'
              : 'No matching items yet. Associate this theme in Quick capture and save a record or task.',
    });
}

import { Component, MarkdownRenderer, Notice, TFile, moment } from 'obsidian';
import type { App } from 'obsidian';
import dayjs, { Dayjs } from 'dayjs';
import type { DailyRecordType, ResourceType } from './type';
import { LogLevel } from './type';
import {
  DAILY,
  WEEKLY,
  MONTHLY,
  QUARTERLY,
  YEARLY,
  ERROR_MESSAGES,
} from './constant';

export function renderError(
  app: App,
  msg: string,
  containerEl: HTMLElement,
  sourcePath: string
) {
  const component = new Component();

  return MarkdownRenderer.render(app, msg, containerEl, sourcePath, component);
}

export async function createFile(
  app: App,
  options: {
    templateFile: string;
    folder: string;
    file: string;
    tag?: string;
  }
) {
  if (!app) {
    return;
  }

  const { templateFile, folder, file, tag } = options;
  const templateTFile = app.vault.getAbstractFileByPath(templateFile!);

  if (!templateTFile) {
    return new Notice(ERROR_MESSAGES.NO_TEMPLATE_EXIST + templateFile);
  }

  if (templateTFile instanceof TFile) {
    const templateContent = await app.vault.cachedRead(templateTFile);

    if (!folder || !file) {
      return;
    }

    const tFile = app.vault.getAbstractFileByPath(file);

    if (tFile && tFile instanceof TFile) {
      return await app.workspace.getLeaf().openFile(tFile);
    }

    if (!app.vault.getAbstractFileByPath(folder)) {
      app.vault.createFolder(folder);
    }

    const fileCreated = await app.vault.create(file, templateContent);

    await Promise.all([
      app.fileManager.processFrontMatter(fileCreated, (frontMatter) => {
        if (!tag) {
          return;
        }

        frontMatter.tags = frontMatter.tags || [];
        frontMatter.tags.push(tag);
      }),
      app.workspace.getLeaf().openFile(fileCreated),
    ]);
  }
}

export function isDarkTheme() {
  const el = document.querySelector('body');
  return el?.className.split(' ').includes('theme-dark') ?? false;
}

export function formatDailyRecord(record: DailyRecordType) {
  const { createdTs, createdAt, content, resourceList } = record;
  const timeStamp = createdAt ? moment(createdAt).unix() : createdTs;
  const [date, time] = moment(timeStamp * 1000)
    .format('YYYY-MM-DD HH:mm')
    .split(' ');
  const [firstLine, ...otherLine] = content.trim().split('\n');
  const isTask = /^- \[.*?\]/.test(firstLine); // 目前仅支持 task
  const isCode = /```/.test(firstLine);

  let targetFirstLine = '';

  if (isTask) {
    targetFirstLine = `- [ ] ${time} ${firstLine.replace(/^- \[.*?\]/, '')}`;
  } else if (isCode) {
    targetFirstLine = `- ${time}`; // 首行不允许存在代码片段
    otherLine.unshift(firstLine);
  } else {
    targetFirstLine = `- ${time} ${firstLine.replace(/^- /, '')}`;
  }

  targetFirstLine += ` #daily-record ^${timeStamp}`;

  const targetOtherLine = otherLine?.length //剩余行
    ? '\n' +
      otherLine
        .map((line: string) => (/^[ \t]/.test(line) ? line : `\t${line}`))
        .join('\n')
        .trimEnd()
    : '';
  const targetResourceLine = resourceList?.length // 资源文件
    ? '\n' +
      resourceList
        ?.map(
          (resource: ResourceType) => `\t - ![[${generateFileName(resource)}]]`
        )
        .join('\n')
    : '';
  const finalTargetContent =
    targetFirstLine + targetOtherLine + targetResourceLine;

  return [date, timeStamp, finalTargetContent].map(String);
}

export function generateFileName(resource: ResourceType): string {
  return `${resource.id}-${resource.filename.replace(/[/\\?%*:|"<>]/g, '-')}`;
}

export function logMessage(message: string, level: LogLevel = LogLevel.info) {
  new Notice(message);

  if (level === LogLevel.info) {
    console.info(message);
  } else if (level === LogLevel.warn) {
    console.warn(message);
  } else if (level === LogLevel.error) {
    console.error(message);
    throw Error(message);
  }
}

export function generateHeaderRegExp(header: string) {
  const formattedHeader = /^#+/.test(header.trim())
    ? header.trim()
    : `# ${header.trim()}`;
  const reg = new RegExp(`(${formattedHeader}[^\n]*)([\\s\\S]*?)(?=\\n##|$)`);

  return reg;
}

export async function createPeriodicFile(
  day: Dayjs,
  periodType: string,
  periodicNotesPath: string,
  app: App | undefined
): Promise<void> {
  if (!app || !periodicNotesPath) {
    return;
  }

  const locale = window.localStorage.getItem('language') || 'en';
  const date = dayjs(day.format()).locale(locale);

  let templateFile = '';
  let folder = '';
  let file = '';

  const year = date.format('YYYY');
  let value;

  if (periodType === DAILY) {
    folder = `${periodicNotesPath}/${year}/${periodType}/${String(
      date.month() + 1
    ).padStart(2, '0')}`;
    value = date.format('YYYY-MM-DD');
  } else if (periodType === WEEKLY) {
    folder = `${periodicNotesPath}/${date.format('gggg')}/${periodType}`;
    value = date.format('gggg-[W]ww');
  } else if (periodType === MONTHLY) {
    folder = `${periodicNotesPath}/${year}/${periodType}`;
    value = date.format('YYYY-MM');
  } else if (periodType === QUARTERLY) {
    folder = `${periodicNotesPath}/${year}/${periodType}`;
    value = date.format('YYYY-[Q]Q');
  } else if (periodType === YEARLY) {
    folder = `${periodicNotesPath}/${year}`;
    value = year;
  }

  file = `${folder}/${value}.md`;
  templateFile = `${periodicNotesPath}/Templates/${periodType}.md`;

  await createFile(app, {
    templateFile,
    folder,
    file,
  });
}

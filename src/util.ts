import { Component, MarkdownRenderer, Notice, moment } from 'obsidian';
import type { App } from 'obsidian';
import type { DailyRecordType, ResourceType } from './type';
import { LogLevel } from './type';

export function renderError(
  app: App,
  msg: string,
  containerEl: HTMLElement,
  sourcePath: string
) {
  const component = new Component();

  return MarkdownRenderer.render(app, msg, containerEl, sourcePath, component);
}

export function isDarkTheme() {
  const el = document.querySelector('body');
  return el?.className.includes('theme-dark') ?? false;
}

export function formatDailyRecord(record: DailyRecordType) {
  const { createdTs, createdAt, content, resourceList } = record;
  const timeStamp = createdAt ? moment(createdAt).unix() : createdTs;
  const [date, time] = moment(timeStamp * 1000)
    .format('YYYY-MM-DD HH:mm')
    .split(' ');
  const [firstLine, ...otherLine] = content.split('\n');
  const isTask = /^- \[.*?\]/.test(firstLine); // 目前仅支持 task
  const targetFirstLine = // 将标签和时间戳加到第一行
    (isTask
      ? `- [ ] ${time} ${firstLine.replace(/^- \[.*?\]/, '')}`
      : `- ${time} ${firstLine.replace(/^- /, '')}`) +
    ` #daily-record ^${timeStamp}`;
  const targetOtherLine = otherLine?.length //剩余行
    ? '\n' +
      otherLine
        .map((line: string) => (/^[ \t]/.test(line) ? line : `\t${line}`))
        .join('\n')
        .replace(/[\n\s]*$/, '') // 增头去尾
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

import { Component, MarkdownRenderer } from 'obsidian';
import type { App } from 'obsidian';

export function renderError(
  app: App,
  msg: string,
  containerEl: HTMLElement,
  sourcePath: string
) {
  const component = new Component();

  return MarkdownRenderer.render(app, msg, containerEl, sourcePath, component);
}

export const isDarkTheme = () => {
  const el = document.querySelector('body');
  return el?.className.includes('theme-dark') ?? false;
};

import { Component, MarkdownRenderer } from 'obsidian';

export function renderError(
  msg: string,
  containerEl: HTMLElement,
  sourcePath: string
) {
  const component = new Component();

  return MarkdownRenderer.renderMarkdown(
    msg,
    containerEl,
    sourcePath,
    component
  );
}
